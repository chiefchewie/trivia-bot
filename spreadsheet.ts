import { google } from "googleapis";
import _ from "lodash";
export interface TriviaQuestion {
    question: string;
    answer: string;
    difficulty: string;
    topic: string;
}

export interface GetQuestionOptions {
    difficulty : "Junior" | "Senior";
    path_to_keyfile : string;
    question_count: number;
    sheet_id : string;
}

export interface LeaderBoardOptions {
    user?: string;
    path_to_keyfile: string;
    sheet_id: string;
    type: "all_time" | "monthly" | "weekly" | "daily";
}

export async function getQuestions(
    options : GetQuestionOptions
) {
    const auth = await google.auth.getClient({
        keyFile: options.path_to_keyfile,
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth: auth });

    const rows = await sheets.spreadsheets.values.get({
        spreadsheetId: options.sheet_id,
        range: `${options.difficulty} Questions!A2:D`, // every row after row 2, colums A through D
    });

    const random_sample = _.sampleSize(rows.data.values, options.question_count);
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

    return questions;
}

export async function getLeaderboards(options: LeaderBoardOptions) {
    const auth = await google.auth.getClient({
        keyFile: options.path_to_keyfile,
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth: auth });

    const rows = await sheets.spreadsheets.values.get({
        spreadsheetId: options.sheet_id,
        range: `Users!A2:E`, // every row after row 2, colums A through E10 (grabs top 10 users)
    });

    const rankings : Object[] = [];
}
