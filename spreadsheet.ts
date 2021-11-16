import { google } from "googleapis";
import _ from "lodash";
export interface TriviaQuestion {
    question: string;
    answer: string;
    difficulty: string;
    topic: string;
}

export interface UserRanking {
    uid: string;
    all_time: number;
    monthly: number;
    weekly: number;
    daily: number;
}

interface SpreadsheetOptions {
    path_to_keyfile: string;
    sheet_id: string;
}

interface GetQuestionOptions extends SpreadsheetOptions {
    difficulty: "Junior" | "Senior";
    question_count: number;
}

interface LeaderboardOptions extends SpreadsheetOptions {
    user_id: string;
}

export async function getQuestions(options: GetQuestionOptions) {
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

export async function getLeaderboards(options: SpreadsheetOptions) {
    const auth = await google.auth.getClient({
        keyFile: options.path_to_keyfile,
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth: auth });

    const rows = await sheets.spreadsheets.values.get({
        spreadsheetId: options.sheet_id,
        range: `Users!A2:E`, // every row after row 2, colums A through E10 (grabs top 10 users)
    });

    const rankings: UserRanking[] = [];
    rows.data.values?.forEach((element) => {
        rankings.push({
            uid: element[0],
            all_time: element[1],
            monthly: element[2],
            weekly: element[3],
            daily: element[4],
        });
    });

    return rankings;
}

export async function updateLeaderboards(options: LeaderboardOptions) {
    const auth = await google.auth.getClient({
        keyFile: options.path_to_keyfile,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth: auth });

    const all_data = await sheets.spreadsheets.values.get({
        spreadsheetId: options.sheet_id,
        range: "Users!A2:E",
    });

    // use google sheets' MATCH function to find the index of a user
    const search_request = {
        // The ID of the spreadsheet to update.
        spreadsheetId: options.sheet_id,

        // The A1 notation of the values to update.
        range: "Users!F1",

        // How the input data should be interpreted.
        valueInputOption: "USER_ENTERED",

        includeValuesInResponse: true,

        resource: {
            values: [[`=MATCH(\"${options.user_id}\", A:A, 0)`]],
        },

        auth: auth,
    };
    const response = (await sheets.spreadsheets.values.update(search_request)).data;

    const user_rowNumber = response.updatedData?.values![0][0];

    if (user_rowNumber === "#N/A") {
        // user not currently in database
        // so we need to at them to the database
        const append_request = {
            spreadsheetId: options.sheet_id,
            range: `Users!A:B`,
            valueInputOption: "USER_ENTERED",
            insertDataOption: "INSERT_ROWS",
            resource: {
                values: [[options.user_id, 10]], // 10 is value per question
            },
        };
        await sheets.spreadsheets.values.append(append_request);
    } else {
        // user already in database
        // so we need to update their values
        // first - get their current value
        const score = parseInt(all_data.data.values![user_rowNumber - 2][1]);
        const update_request = {
            spreadsheetId: options.sheet_id,
            range: `Users!B${user_rowNumber}`,
            valueInputOption: "USER_ENTERED",
            resource: {
                range: `Users!B${user_rowNumber}`,
                values: [[score + 10]],
            },
        };
        await sheets.spreadsheets.values.update(update_request);
    }
}

export async function getUser(options: LeaderboardOptions) {
    const auth = await google.auth.getClient({
        keyFile: options.path_to_keyfile,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth: auth });

    const all_data = await sheets.spreadsheets.values.get({
        spreadsheetId: options.sheet_id,
        range: "Users!A2:E",
    });

    // use google sheets' MATCH function to find the index of a user
    const search_request = {
        // The ID of the spreadsheet to update.
        spreadsheetId: options.sheet_id,

        // The A1 notation of the values to update.
        range: "Users!F1",

        // How the input data should be interpreted.
        valueInputOption: "USER_ENTERED",

        includeValuesInResponse: true,

        resource: {
            values: [[`=MATCH(\"${options.user_id}\", A:A, 0)`]],
        },

        auth: auth,
    };
    const response = (await sheets.spreadsheets.values.update(search_request)).data;

    const user_rowNumber = response.updatedData?.values![0][0];

    if (user_rowNumber === "#N/A") {
        // user not currently in database
        return `${options.user_id} not in db`;
    } else {
        return all_data.data.values![user_rowNumber - 2];
    }
}
