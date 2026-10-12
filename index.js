require('dotenv').config();

const express = require('express');
const fs = require('node:fs/promises');
const path = require('node:path');

const app = express();
const PORT = Number(process.env.PORT) || 8080;
const DATA_FILE = path.join(__dirname, 'tshirts.json');
const RAJA_ONGKIR_URL = new URL(
    'calculate/domestic-cost',
    process.env.RAJA_ONGKIR_BASE_URL || 'https://rajaongkir.komerce.id/api/v1/'
);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/tshirt', async (req, res) => {
    const tshirts = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
    res.status(200).json(tshirts);
});

app.post('/shipping/cost', async (req, res) => {
    const apiKey = process.env.RAJA_ONGKIR_API_KEY;
    const origin = process.env.RAJA_ONGKIR_ORIGIN;
    const { destination, weight, courier } = req.body || {};

    if (!apiKey || !origin) {
        return res.status(503).json({
            message: 'Konfigurasi RajaOngkir belum lengkap. Isi API key dan origin di .env.'
        });
    }

    if (!/^\d+$/.test(origin) || !/^\d+$/.test(String(destination ?? ''))) {
        return res.status(400).json({
            message: 'Origin dan destination harus berupa ID lokasi numerik RajaOngkir.'
        });
    }

    if (!Number.isInteger(Number(weight)) || Number(weight) <= 0) {
        return res.status(400).json({ message: 'Berat harus berupa angka gram lebih dari 0.' });
    }

    if (typeof courier !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(courier)) {
        return res.status(400).json({ message: 'Kode kurir tidak valid.' });
    }

    let upstreamResponse;
    try {
        const body = new URLSearchParams({
            origin,
            destination: String(destination),
            weight: String(Number(weight)),
            courier
        });

        upstreamResponse = await fetch(RAJA_ONGKIR_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                key: apiKey
            },
            body,
            signal: AbortSignal.timeout(15000)
        });
    } catch (error) {
        console.error('RajaOngkir request failed:', error.message);
        return res.status(502).json({ message: 'Tidak dapat menghubungi layanan RajaOngkir.' });
    }

    const responseText = await upstreamResponse.text();
    let result;
    try {
        result = JSON.parse(responseText);
    } catch {
        console.error(`RajaOngkir returned invalid JSON (HTTP ${upstreamResponse.status}).`);
        return res.status(502).json({ message: 'Respons dari RajaOngkir tidak valid.' });
    }

    if (
        !result ||
        typeof result !== 'object' ||
        !upstreamResponse.ok ||
        Number(result.meta?.code) >= 400
    ) {
        return res.status(502).json({
            message: result?.meta?.message || 'RajaOngkir gagal menghitung ongkir.'
        });
    }

    return res.status(200).json(result);
});

app.post('/tshirt/:id', async (req, res) => {
    const { id } = req.params;
    const { logo, size } = req.body;

    if (!logo) {
        return res.status(400).json({ message: 'We need a logo' });
    }

    const tshirts = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
    const newTshirt = {
        id,
        name: `Shirt with logo ${logo}`,
        size: size || 'large',
        logo
    };

    tshirts.push(newTshirt);
    await fs.writeFile(DATA_FILE, `${JSON.stringify(tshirts, null, 2)}\n`);

    res.status(201).json({
        tshirt: `Shirt with logo ${logo} and id ${id}`
    });
});

app.listen(PORT, () => console.log(`its Alive on http://localhost:${PORT}`));
