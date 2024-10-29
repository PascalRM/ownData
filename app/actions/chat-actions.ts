'use server';

import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import {
    ChatPromptTemplate,
    MessagesPlaceholder,
} from "@langchain/core/prompts";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { ChatMessageHistory } from "langchain/stores/message/in_memory";
import { BaseChatMessageHistory } from "@langchain/core/chat_history";


export async function prompt(prevState: { error: string }, formData: FormData) {
    const prompt = formData.get("prompt")?.toString();

    const llm = new ChatOpenAI({ model: "gpt-3.5-turbo", temperature: 0 });

    const loader = new DirectoryLoader(
        "sample_data",
        {
            ".txt": (path) => new TextLoader(path),
            // ".pdf": (path) => new PDFLoader(path)
        }
    );

    const docs = await loader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    const splits = await textSplitter.splitDocuments(docs);

    const vectorstore = await MemoryVectorStore.fromDocuments(
        splits,
        new OpenAIEmbeddings()
    );

    const retriever = vectorstore.asRetriever();


    // Contextualize question
    const contextualizeQSystemPrompt =
        "Given a chat history and the latest user question " +
        "which might reference context in the chat history, " +
        "formulate a standalone question which can be understood " +
        "without the chat history. Do NOT answer the question, " +
        "just reformulate it if needed and otherwise return it as is.";

    const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
        ["system", contextualizeQSystemPrompt],
        new MessagesPlaceholder("chat_history"),
        ["human", "{input}"],
    ]);

    const historyAwareRetriever = await createHistoryAwareRetriever({
        llm: llm,
        retriever: retriever,
        rephrasePrompt: contextualizeQPrompt,
    });

    // Answer question
    const systemPrompt =
        "You are an assistant for question-answering tasks. " +
        "Use the following pieces of retrieved context to answer " +
        "the question. If you don't know the answer, say that you " +
        "don't know. Use three sentences maximum and keep the " +
        "answer concise." +
        "\n\n" +
        "{context}";

    const qaPrompt = ChatPromptTemplate.fromMessages([
        ["system", systemPrompt],
        new MessagesPlaceholder("chat_history"),
        ["human", "{input}"],
    ]);

    const questionAnswerChain = await createStuffDocumentsChain({
        llm,
        prompt: qaPrompt,
    });

    const ragChain = await createRetrievalChain({
        retriever: historyAwareRetriever,
        combineDocsChain: questionAnswerChain,
    });

    // Statefully manage chat history
    const store: Record<string, BaseChatMessageHistory> = {};

    function getSessionHistory(sessionId: string): BaseChatMessageHistory {
        if (!(sessionId in store)) {
            store[sessionId] = new ChatMessageHistory();
        }
        return store[sessionId];
    }

    const conversationalRagChain = new RunnableWithMessageHistory({
        runnable: ragChain,
        getMessageHistory: getSessionHistory,
        inputMessagesKey: "input",
        historyMessagesKey: "chat_history",
        outputMessagesKey: "answer",
    });

    const query = prompt ? prompt : " ";

    const res = await conversationalRagChain.invoke(
        { input: query },
        { configurable: { sessionId: "unique_session_id" } }
    )

    console.log(res);

    return { answer: res.answer, context: JSON.parse(JSON.stringify(res.context)), error: "" }
}