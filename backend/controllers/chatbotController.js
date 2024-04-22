const { ChatOpenAI } = require('@langchain/openai');
const { SupabaseVectorStore } = require('@langchain/community/vectorstores/supabase');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { createClient } = require('@supabase/supabase-js');
const { RunnablePassthrough, RunnableSequence } = require('@langchain/core/runnables')
const { PromptTemplate } = require('@langchain/core/prompts')
const { StringOutputParser } = require('@langchain/core/output_parsers')

const dotenv = require('dotenv');
dotenv.config();



// Utility to format conversation history
const formatConvHistory = (messages) => {
    return messages.map((message, i) => {
        if (i % 2 === 0) {
            return `Human: ${message}`;
        } else {
            return `AI: ${message}`;
        }
    }).join('\n');
};

// Utility to combine retrieved documents
const combineDocuments = (docs) => {
    return docs.map(doc => doc.pageContent).join('\n\n');
};


// Define Prompt Templates
const standaloneQuestionTemplate = `Given some conversation history (if any) and a question, convert the question to a standalone question. 
conversation history: {conv_history}
question: {question} 
standalone question:`
const standaloneQuestionPrompt = PromptTemplate.fromTemplate(standaloneQuestionTemplate)

const answerTemplate = `You are a helpful and enthusiastic support bot who can answer a given question about F1 Visa based on the context provided and the conversation history. Try to find the answer in the context. If the answer is not given in the context, find the answer in the conversation history if possible. If you really don't know the answer, say "I'm sorry, I don't know the answer to that." And direct the questioner to email help@companyName.com. Don't try to make up an answer. Always speak as if you were chatting to a friend.
context: {context}
conversation history: {conv_history}
question: {question}
answer: `
const answerPrompt = PromptTemplate.fromTemplate(answerTemplate)


exports.processConversation = async (req, res) => {
    const { question, convHistory } = req.body;
    try {
        

        // Initialize OpenAI and Supabase
        const openAIApiKey = process.env.OPENAI_API_KEY;
        const llm = new ChatOpenAI({ apiKey: openAIApiKey });

        const embeddings = new OpenAIEmbeddings({ apiKey: openAIApiKey });
        const sbApiKey = process.env.SUPABASE_API_KEY;
        const sbUrl = process.env.SUPABASE_URL_LC_CHATBOT;
        const client = createClient(sbUrl, sbApiKey);

        const vectorStore = new SupabaseVectorStore(embeddings, {
            client,
            tableName: 'documents',
            queryName: 'match_documents'
        })
        const retriever = vectorStore.asRetriever();

        // Chain Definitions
        
        const standaloneQuestionChain = standaloneQuestionPrompt
        .pipe(llm)
        .pipe(new StringOutputParser());

        const retrieverChain = RunnableSequence.from([
        prevResult => prevResult.standalone_question,
        retriever,
        combineDocuments
        ]);

        const answerChain = answerPrompt
        .pipe(llm)
        .pipe(new StringOutputParser());

        const chain = RunnableSequence.from([
        {
            standalone_question: standaloneQuestionChain,
            original_input: new RunnablePassthrough()
        },
        {
            context: retrieverChain,
            question: ({ original_input }) => original_input.question,
            conv_history: ({ original_input }) => original_input.conv_history
        },
        answerChain
        ]);

        const response = await chain.invoke({
            question: question,
            conv_history: formatConvHistory(convHistory)
        });
        res.json({ message: response });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};
