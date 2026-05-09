import bcrypt from "bcryptjs";

const hash = "$2b$10$Tcocp1Bj5gnWrzB5vTv9dOPEYrpoXNO5b19BOGlA1D2g5cBeqPQYW";
const password = "123456";

async function check() {
    const isValid = await bcrypt.compare(password, hash);
    console.log("Is valid:", isValid);

    if (!isValid) {
        const newHash = await bcrypt.hash(password, 10);
        console.log("Correct hash for '123456' is:", newHash);
    }
}

check();
