"use client";

import { useEffect, useOptimistic, useRef, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Loader2, Send } from "lucide-react";
import { useFormState, useFormStatus } from "react-dom";
import { prompt } from "@/app/actions/chat-actions";
import { formatDate } from "@/lib/utils";

type Message = {
    id: number;
    role: string;
    content: string;
    date: Date;
}

export function ChatWindow() {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const [state, formAction] = useFormState(prompt, { error: "", answer: "", context: [] });
    const [messages, setMessages] = useState<Message[]>([{ id: 1, role: 'assistant', content: 'Hi, how can I help you?', date: new Date()}]);
    const [optimisticMessages, addOptimisticMessage] = useOptimistic(
        messages,
        (state, newMessage: Message) => [
            ...state,
            newMessage
        ]
    );
    const [inputValue, setInputValue] = useState("");

    useEffect(() => {
        if (state.answer !== "") {
            setMessages(prev => [...prev, {
                id: Math.max(...prev.map(m => m.id)) + 1,
                role: 'assistant',
                content: state.answer,
                date: new Date()
            }]);
        }
    }, [state]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages]);

    const handleSubmit = async () => {
        if (!inputValue.trim()) return; // Don't submit empty messages

        const formData = new FormData();
        formData.append("prompt", inputValue);

        // Generate a unique ID for the message
        const newMessageId = messages.length > 0
            ? Math.max(...messages.map(m => m.id)) + 1
            : 1;

        const msg = {
            id: newMessageId,
            role: 'user',
            content: inputValue,
            date: new Date()
        };

        // Clear input
        setInputValue("");
        addOptimisticMessage({ ...msg });
        setMessages(prev => [...prev, msg]);


        formAction(formData);
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            formRef.current?.requestSubmit();
        }
    }

    const SubmitButton = () => {
        const { pending } = useFormStatus();
        return (<>
            <Button type="submit" size="icon" className="shrink-0" disabled={pending}>
                {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Send className="h-4 w-4" />
                )}
                <span className="sr-only">Send</span>
            </Button>
        </>);
    }

    const fnDate = (d: string) => formatDate(d);

    return (
        <div className="flex-1 flex flex-col overflow-hidden p-4">
            <Card className="flex flex-col flex-1 overflow-hidden b">
                <CardHeader className="shrink-0 ">
                    <h2 className="text-2xl font-bold">Chat</h2>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-4">
                    <ScrollArea className="h-full" ref={scrollAreaRef}>
                        <div className="flex flex-col p-4">
                            {optimisticMessages.map(m => (
                                <div key={m.id} className="mb-4 flex flex-col">
                                    <div className={`flex items-center ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`rounded-lg p-3 ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                            <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                                        </div>
                                    </div>
                                    <span className="mt-1 text-xs text-muted-foreground">
                                        {m.role === 'user' ? 'You' : 'AI'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="shrink-0 pt-4">
                    <form
                        className="flex w-full items-start space-x-2"
                        action={handleSubmit}
                        ref={formRef}
                    >
                        <Textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type your message here..."
                            className="flex-1 min-h-[38px]"
                            rows={1}
                            onKeyDown={onKeyDown}
                        />
                        <SubmitButton />
                    </form>
                </CardFooter>
            </Card>
        </div>
    )
}
