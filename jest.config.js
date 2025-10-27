module.exports =
{
    preset: "ts-jest",
    testEnvironment: "jsdom",
    transform:
    {
        "^.+\\.(ts|tsx)$": "ts-jest"
    },
    moduleNameMapper:
    {
        "^@/(.*)$": "<rootDir>/$1",
        // map CSS/image imports if needed:
        "^.+\\.(css|scss)$": "identity-obj-proxy"
    },
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"]
};