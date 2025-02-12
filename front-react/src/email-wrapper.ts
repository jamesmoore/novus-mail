// https://making.close.com/posts/rendering-untrusted-html-email-safely

const applyEmailTemplate = (contents: string ) => {

    const template = `
        <html><head>
        <meta http-equiv="Content-Security-Policy" content="script-src 'none'">
        <base target="_blank">
        <style>
            body { font: 16px sans-serif; }
        </style>
        </head>
        <body>${contents}</body>
        </html>
    `

    return template;
}

export default applyEmailTemplate;