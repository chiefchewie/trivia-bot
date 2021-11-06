import { MessageEmbed } from "discord.js";
import { GoogleSpreadsheet, GoogleSpreadsheetRow } from "google-spreadsheet";
import _ from "lodash";
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
        const questions = _.sampleSize(await senior_questions.getRows(), count);
        const embeds: MessageEmbed[] = [];
        for (const q of questions) {
            var embed = new MessageEmbed({
                title: q.question,
                description: "cheezits"
            })
            embeds.push(embed);
        }

        return embeds;
    }
}
