import { main } from './index.js';

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Error: ', err);
        process.exit(1);
    });