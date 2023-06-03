import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs';
import slugify from 'slugify';
import dotenv from 'dotenv';
dotenv.config()
; ((async () => {
    app()
}))();

async function app() {
    while(true) {
        let topic = await pickTopic()
        if(!topic) {
            logToFile("No Topic")
            process.exit(0)
            return
        }
        await complition(topic)
    }


}

function logToFile(str) {
    console.log(str)
    fs.appendFileSync('./log.txt', str + "\n")
}

async function complition(topic) {
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const prompt = fs.readFileSync('./prompt.txt', 'utf8');
    // let topic = "How to install Nodejs on Windows, Also mention about NVM"
    if(!topic) {
        logToFile("No Topic Provided")
        return
    }
    const final = prompt.replace("POST_TOPIC", topic)
    const start = Date.now();
    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: final,
        max_tokens: 3400,
        temperature: 0.9,
        // stop: ["</EndOFText>"]
    });
    const end = Date.now();
    logToFile(`Took ${(end - start)/1000} sec to generate post for: ${topic}`);
    // logToFile(completion.data.choices[0].text);
    writeComplition(final, completion.data.choices[0].text, topic)
}

function writeComplition(prompt, resp, topic) {
    const timestampStr = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    const filename = `./completions/${slugify(topic, { strict: true, lower: true })}_${timestampStr}.txt`;
    const InvalidRespFilename = `./completions/InvalidResp_${slugify(topic, { strict: true, lower: true })}_${timestampStr}.txt`;
    let final = prompt + resp;
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
    if (resp.includes("TITLE") && resp.includes("META_DESCRIPTION") && resp.includes("TAGS") && resp.includes("CATEGORIES") && resp.includes("</EndOFText>")) {
        return true
    } else {
        return false
    }
}

async function pickTopic() {
    // pick a topic from the topics.txt file and remove it from the file and return it
    const topics = fs.readFileSync('./topics.txt', 'utf8');
    const topicsArr = topics.split("\n").map(topic => topic.trim()).filter(topic => topic)
    if(topicsArr.length === 0) {
        logToFile("No Topics Left")
        return
    }
    const topic = topicsArr[0]
    topicsArr.shift()
    fs.writeFileSync('./topics.txt', topicsArr.join("\n"))
    // put the topic in the used topics file
    fs.appendFileSync('./usedTopics.txt', topic + "\n")
    return topic
}