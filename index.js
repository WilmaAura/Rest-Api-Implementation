const express = require('express');
const fs = require('node:fs/promises');
const path = require('node:path');

const app = express();
const PORT = 8080;
const DATA_FILE = path.join(__dirname, 'tshirts.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/tshirt', async (req, res) => {
    const tshirts = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
    res.status(200).json(tshirts);
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
