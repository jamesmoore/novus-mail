// https://making.close.com/posts/rendering-untrusted-html-email-safely

const applyEmailTemplate = (contents: string ) => {

    const upgraded = upgradeHttpToHttps(contents);

    const template = `
        <html><head>
        <meta http-equiv="Content-Security-Policy" content="script-src 'none'">
        <base target="_blank">
        <style>
            body { font: 16px sans-serif; }
        </style>
        </head>
        <body>${upgraded}</body>
        </html>
    `

    return template;
}

const upgradeHttpToHttps = (text: string) => {
    return text.replace(/http:\/\/([^ ]+)/g, 'https://$1');
}

export default applyEmailTemplate;