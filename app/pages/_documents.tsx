import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
    return (
        <Html lang="es">
            <Head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700&display=swap"
                    rel="stylesheet"
                />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
