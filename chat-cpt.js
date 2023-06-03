import fs from 'fs';
import slugify from 'slugify';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config()

const topics = [];

((async () => {
    deduplicateTopics()
    await loadTopics()

    let max = 200
    while (topics.length < max) {
        console.log("Topics: " + topics.length)
        await generateTopics()
    }
    app()
}))();

async function api(history) {
    try {
    let resp = await axios.post('https://api.openai.com/v1/chat/completions', {
        "model": "gpt-3.5-turbo",
        "messages": history
    }, {
        headers: {
            "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
        }
    })
    return resp.data.choices[0].message
    } catch(e) {
        // console.log(e)
       throw new Error("API Error")
    }
}

async function generateTopics(category) {
    if (!category) {
        // read from file
        let file = fs.readFileSync('./categories.txt', 'utf8');
        file = file.split("\n")
        file = file.filter((topic) => {
            return topic.length > 0 && topic.length <= 100
        })
        file = file.map((topic) => {
            return topic.trim()
        })
        // randomize the array
        file.sort(() => Math.random() - 0.5);
        category = file[0]
    }
    let history = [
        { "role": "system", "content": `I am a Post topic Generator, Send me a niche, and i will send you Article Topics, There will be one topic per line, and i will send total 50 Article Topics` },
        { "role": "user", "content": category }
    ]
    let resp = await api(history)
    let lc = resp.content.split("\n")
    lc = lc.filter((topic) => {
        return topic.length > 0 && topic.length <= 100
    })
    lc = lc.map((topic) => {
        // 1. Emerging trends in your industry over the next decade\n
        // remove the number and the dot
        return topic.replace(/^\d+\./, "").trim()
    })

    topics.push(...lc)
    syncTopics()
}

async function app() {
    // load the topics
    while (true) {

        let batchSize = 30
        let batch = []
        for (let i = 0; i < batchSize; i++) {
            // get first 10 topics
            let topic = await pickTopic()
            if (!topic) {
                logToFile("No Topic")
                if (batch.length == 0) {
                    logToFile("Batch Done")
                    process.exit(0)
                }
                return
            }
            batch.push({ topic: topic, task: complition(topic) })
        }

        // loop through the batch
        while (batch.length > 0) {
            let task = batch.shift()
            try {
                await task.task
            } catch (e) {
                logToFile("Error for " + task.topic)
                // logToFile(e)
                resycleTopic(task.topic)
            }
        }
    }


}

function logToFile(str) {
    console.log(str)
    fs.appendFileSync('./log.txt', str + "\n")
}



async function combine(history) {
    let final = ""
    for (let i = 0; i < history.length; i++) {
        if (history[i].role === "assistant") {
            final += history[i].content
        }
    }
    return final
}

async function complition(topic) {
    logToFile("Starting for " + topic)
    const tries = 4
    // chatgpt
    const prompt = fs.readFileSync('./prompt-chat.txt', 'utf8');
    let history = [
        { "role": "system", "content": prompt.toString() },
        { "role": "user", "content": topic }
    ]
    while (true) {
        try {
            let resp = await api(history)
            history.push(resp)
            let final = await combine(history)
            if (testResp(final)) {
    
                writeComplition(prompt, final, topic)
                logToFile("Done for " + topic)
                break
            }
            if (history.length > tries) {
                logToFile("No valid response for " + topic)
                writeComplition(prompt, final, topic)
                // addTopic(topic)
                // sleep(1000)
                await new Promise(resolve => setTimeout(resolve, 1000));
                break
            }
            history.push({ "role": "user", "content": "continue, send \"EndOFText\" if done" })
        } catch(e) {
            logToFile("Error for " + topic)
            // logToFile(e)
            resycleTopic(topic)
            // throw new Error("Error")
            break
        }

    }

}

function writeComplition(prompt, resp, topic) {
    const timestampStr = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    const filename = `./chats/${slugify(topic, { strict: true, lower: true })}_${timestampStr}.txt`;
    const InvalidRespFilename = `./invalidresp/${slugify(topic, { strict: true, lower: true })}_${timestampStr}.txt`;
    let final = `${prompt}\nTOPIC: ${topic}\n\n${resp}`;
    final = final.replace("<Post Content Will go here>", "")
    if (testResp(resp)) {
        fs.writeFileSync(filename, final);
        logToFile(`Wrote completion to ${filename}`);
    } else {
        logToFile("Invalid Response \n\n")
        fs.writeFileSync(InvalidRespFilename, final);
        logToFile(`Wrote Invalid completion to ${InvalidRespFilename}`);
    }
}

function testResp(resp) {
    // check if the response is valid
    if (resp.includes("TITLE") && resp.includes("META_DESCRIPTION") && resp.includes("TAGS") && resp.includes("CATEGORIES") && resp.toString().toLowerCase().includes("endoftext")) {
        return true
    } else {
        return false
    }
}

async function pickTopic() {
    const topic = topics.shift()
    syncTopics()
    fs.appendFileSync('./usedTopics.txt', topic + "\n")
    return topic
}

async function loadTopics() {
    // load the topics from the topics.txt file
    const topicsF = fs.readFileSync('./topics.txt', 'utf8');
    const topicsArr = topicsF.split("\n").map(topic => topic.trim()).filter(topic => topic)
    topics.push(...topicsArr)
    return topicsArr
}
async function resycleTopic(topic) {
    syncTopics()
    topics.push(topic)
}

function syncTopics() {
    // sync the topics to the topics.txt file
    fs.writeFileSync('./topics.txt', topics.join("\n"))
}

// deduplicate the topics
function deduplicateTopics() {
    const topicsF = fs.readFileSync('./topics.txt', 'utf8');
    const topicsArr = topicsF.split("\n").map(topic => topic.trim()).filter(topic => topic)
    const topicsSet = new Set(topicsArr)
    fs.writeFileSync('./topics.txt', [...topicsSet].join("\n"))
}

