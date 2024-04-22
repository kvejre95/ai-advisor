require('dotenv').config();
const fs = require('fs').promises;

const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { createClient } = require('@supabase/supabase-js');
const { SupabaseVectorStore } = require('@langchain/community/vectorstores/supabase');
const { OpenAIEmbeddings } = require('@langchain/openai');

const upload_data = async () => {
    try {
        const text = await fs.readFile('f1-kb.txt', 'utf8');
        const splitter = new RecursiveCharacterTextSplitter();

        const output = await splitter.createDocuments([text]);

        const sbApiKey = process.env.SUPABASE_API_KEY;
        const sbUrl = process.env.SUPABASE_URL_LC_CHATBOT;
        const openAIApiKey = process.env.OPENAI_API_KEY;
        
        const client = createClient(sbUrl, sbApiKey);

        await SupabaseVectorStore.fromDocuments(
            output,
            new OpenAIEmbeddings({ openAIApiKey }),
            {
                client,
                tableName: 'documents',
            }
        );

    } catch (err) {
        console.log(err);
    }
};
upload_data();
