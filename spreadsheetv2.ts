import { google } from "googleapis";
import _ from "lodash";
export interface TriviaQuestion {
    question: string;
    answer: string;
    difficulty: string;
    topic: string;
}

export async function getQuestions(
    type: string,
    sheet_id: string,
    path_to_keyFile: string,
    count: number
) {
    if (type !== "Senior" && type !== "Junior") {
        throw new Error("question type must be 'Senior' or 'Junior'");
    }

    const auth = await google.auth.getClient({
        keyFile: path_to_keyFile,
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth: auth });

    const rows = await sheets.spreadsheets.values.get({
        spreadsheetId: sheet_id,
        range: `${type} Questions!A2:D`, // every row after row 2, colums A through D
    });

    const random_sample = _.sampleSize(rows.data.values, count);
    const questions: TriviaQuestion[] = [];
    random_sample.forEach((row) => {
        var trivia_question: TriviaQuestion = {
            question: row[0],
            answer: row[1],
            difficulty: row[2],
            topic: row[3],
        };
        questions.push(trivia_question);
    });

    console.log(questions);
}
