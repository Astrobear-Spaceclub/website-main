import filesystem from "fs";

const metadataDir = filesystem.readdirSync('metadata');
const ipfsImages = 'ipfs://QmbSoDitepM88ctWxTdtGy1Lq5T6JgGjrv9DDPRGthk82A';
const ipfsImagesClaimed = 'ipfs://QmRhLspDAEc6PoZmFB2zZV7822X3b7i4TTPqw6nUFk8QW6';

for (const filename of metadataDir) {
    if (filename.indexOf('.json') !== -1) {
        const content = JSON.parse(filesystem.readFileSync(`metadata/${filename}`).toString());
        const contentClaimed = JSON.parse(filesystem.readFileSync(`metadata/${filename}`).toString());

        content.image = `${ipfsImages}/${filename.replace('.json', '.jpg')}`;
        contentClaimed.image = `${ipfsImagesClaimed}/${filename.replace('.json', '.jpg')}`;

        filesystem.writeFileSync(`metadata_generated/${filename.replace('.json', '')}`, JSON.stringify(content));
        filesystem.writeFileSync(`metadata_generated_claimed/${filename.replace('.json', '')}`, JSON.stringify(contentClaimed));
    }
}

process.exit();