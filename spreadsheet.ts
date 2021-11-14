import { GoogleSpreadsheet } from "google-spreadsheet";
import _ from "lodash";
export interface TriviaQuestion {
    question: string;
    answer: string;
    difficulty: string;
    topic: string;
}
export class QuestionSpreadsheet {
    id: string;
    client_email: string;
    private_key: string;
    doc: GoogleSpreadsheet;
    constructor(id: string, client_email: string, private_key: string) {
        this.id = id;
        this.client_email = client_email;
        this.private_key = private_key;
        this.doc = new GoogleSpreadsheet(id);
        this.init();
    }

    init() {
        this.login();
    }

    async login() {
        await this.doc.useServiceAccountAuth({
            client_email: this.client_email,
            private_key: this.private_key,
        });
    }

    async getSeniorQuestions(count: number = 5) {
        await this.doc.loadInfo();

        const senior_questions = this.doc.sheetsByTitle["Senior Questions"];
        const spreadsheet_rows = _.sampleSize(await senior_questions.getRows(), count);
        const all_questions: TriviaQuestion[] = [];

        for (const row of spreadsheet_rows) {
            const question: TriviaQuestion = {
                question: row.question,
                answer: row.answer,
                difficulty: row.difficulty,
                topic: row.topic,
            };
            all_questions.push(question);
        }

        return all_questions;
    }
}
