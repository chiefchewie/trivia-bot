import { QuestionSpreadsheet } from "./spreadsheet";
import { GOOGLE_PRIVATE_KEY, GOOGLE_SERVICE_ACCOUNT_EMAIL } from "./config.json";
import readline from "readline";

const qs = new QuestionSpreadsheet(
    "1-368THFNircUUSvUJGe9GuH2rAnU8ZKPeahuAG8K7iA",
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_PRIVATE_KEY
);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function waitForUserInput() {
    rl.question("Command: ", async function (answer) {
        if (answer == "exit") {
            rl.close();
        } else {
            await qs.getSeniorQuestions(1);
            waitForUserInput();
        }
    });
}

waitForUserInput();
