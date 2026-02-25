module.exports = [
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                // Browser
                window: "readonly",
                document: "readonly",
                navigator: "readonly",
                localStorage: "readonly",
                fetch: "readonly",
                Intl: "readonly",
                console: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                HTMLElement: "readonly",
                HTMLInputElement: "readonly",
                URL: "readonly",
                
                // Node.js
                process: "readonly",
                __dirname: "readonly",
                require: "readonly",
                module: "readonly",
                global: "readonly",
                
                // Service Worker
                self: "readonly",
                caches: "readonly",
                
                // General
                globalThis: "readonly",
                
                // Test specific (injected by test runner)
                ApiService: "readonly",
                FinanceEngine: "readonly",
                createAlertHTML: "readonly",
                getRegionFromPostcode: "readonly",
                updateSalaryType: "readonly",
                updateTaxEstimate: "readonly",
                calculateEquityDetails: "readonly",
                calculateFinalSplit: "readonly",
                clearCacheAndReload: "readonly"
            }
        },
        rules: {
            "semi": ["error", "always"],
            "prefer-const": "error",
            "no-unused-vars": ["warn", { 
                "argsIgnorePattern": "^_",
                "varsIgnorePattern": "^_",
                "caughtErrorsIgnorePattern": "^_"
            }],
            "no-undef": "error"
        }
    }
];
