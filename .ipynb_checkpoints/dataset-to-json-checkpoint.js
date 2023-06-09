import fs from 'fs';
import path from 'path';
import * as url from 'url';
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const chatsDir = path.join(__dirname, 'chats');
const datasetsDir = path.join(__dirname, 'datasets');
const customDatasetName = 'posts.json';
const vicuna = "vicuna.json";

(async () => {
    process()
})()

async function process() {
    // Get all files in chats directory
    let res = []
    let files = await fs.promises.readdir(chatsDir);
    for (let file of files) {
        let filePath = path.join(chatsDir, file);
        let data = parseFile(filePath)
        res.push(data)
        // console.log(data)
    }
    let datasetPath = path.join(datasetsDir, customDatasetName);
    fs.writeFileSync(datasetPath, JSON.stringify(res, null, 2))

    res = []

    for (let file of files) {
        let filePath = path.join(chatsDir, file);
        let data = parseFileVicuna(filePath)
        res.push(data)
        // console.log(data)
    }
    let vicunaDataset = path.join(datasetsDir, vicuna);
    fs.writeFileSync(vicunaDataset, JSON.stringify(res, null, 2))
}

function parseFile(path) {
    let conetnt = fs.readFileSync(path, 'utf8');
    try {
        conetnt = conetnt.split('TOPIC: ')[1]
        conetnt = 'TOPIC: ' + conetnt
        // console.log(conetnt)
        const topic = /TOPIC:(.+)/gm;
        const title = /TITLE:(.+)/gm;
        const meta = /META_DESCRIPTION:(.+)/gm;
        const tags = /TAGS:(.+)/gm;
        const categories = /CATEGORIES:(.+)/gm;
    
        const topicMatch = topic.exec(conetnt);
        const titleMatch = title.exec(conetnt);
        const metaMatch = meta.exec(conetnt);
        const tagsMatch = tags.exec(conetnt);
        const categoriesMatch = categories.exec(conetnt);
    
        const body = conetnt.split(categoriesMatch[0])[1]
    
        return {
            instruction: 'Write a blog post in Markdown about the following topic',
            topic: (topicMatch ? topicMatch[1] : '').trim(),
            title: (titleMatch ? titleMatch[1] : '').trim(),
            meta: (metaMatch ? metaMatch[1] : '').trim(),
            tags: (tagsMatch ? tagsMatch[1] : '').trim(),
            categories: (categoriesMatch ? categoriesMatch[1] : '').trim(),
            body: body.trim().replace(/endoftext/ig, '').replace(/--$/ig, '').replace(/\<\>$/ig, '').replace("MARKDOWN_POST_CONTENT:", "").trim()
        }
    } catch (error) {
        console.log(conetnt)
    }

}

function parseFileVicuna(path) {
    let conetnt = fs.readFileSync(path, 'utf8');
    try {
        conetnt = conetnt.split('TOPIC: ')[1]
        conetnt = 'TOPIC: ' + conetnt
        // console.log(conetnt)
        const topic = /TOPIC:(.+)/gm;
        const title = /TITLE:(.+)/gm;
        const meta = /META_DESCRIPTION:(.+)/gm;
        const tags = /TAGS:(.+)/gm;
        const categories = /CATEGORIES:(.+)/gm;
    
        const topicMatch = topic.exec(conetnt);
        const titleMatch = title.exec(conetnt);
        const metaMatch = meta.exec(conetnt);
        const tagsMatch = tags.exec(conetnt);
        const categoriesMatch = categories.exec(conetnt);
    
        const body = conetnt.split(categoriesMatch[0])[1]
    
        let data = {
            topic: (topicMatch ? topicMatch[1] : '').trim(),
            title: (titleMatch ? titleMatch[1] : '').trim(),
            meta: (metaMatch ? metaMatch[1] : '').trim(),
            tags: (tagsMatch ? tagsMatch[1] : '').trim(),
            categories: (categoriesMatch ? categoriesMatch[1] : '').trim(),
            body: body.trim().replace(/endoftext/ig, '').replace(/--$/ig, '').replace(/\<\>$/ig, '').replace("MARKDOWN_POST_CONTENT:", "").trim()
        }
        return {
            instruction: 'Write a blog post in Markdown about the following topic',
            input: data.topic,
            output: `TITLE:${data.title}\nMETAL${data.meta}\nTAGS:${data.tags}\nCATEGORIES:${data.categories}\n\n----\n${data.body}`

        }
    } catch (error) {
        console.log(conetnt)
    }

}