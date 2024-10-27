"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Send } from "lucide-react";
import { useFormState } from "react-dom";
import { prompt } from "@/app/actions/chat-actions";

const data = {
    chatMessages: [
        { id: 1, role: 'assistant', content: 'Hi, how can I help you?' },
        // { id: 2, role: 'assistant', content: 'Of course! I\'d be happy to help. What\'s your question about React?' },
        // { id: 3, role: 'user', content: 'I\'m having trouble understanding how to use the useEffect hook. Can you explain it?' },
        // { id: 4, role: 'assistant', content: 'The useEffect hook in React is used for side effects in function components. It\'s similar to componentDidMount, componentDidUpdate, and componentWillUnmount lifecycle methods combined. Here\'s a basic example:\n\nuseEffect(() => {\n  // This code runs after every render\n  console.log("Component rendered");\n\n  return () => {\n    // This is the cleanup function\n    console.log("Component will unmount or re-render");\n  };\n}, []); // Empty dependency array means this effect runs once on mount\n\nThe first argument is a function that contains the side effect. The second argument is an array of dependencies. If you want the effect to run only once when the component mounts, pass an empty array.' },
        // { id: 5, role: 'user', content: 'That\'s helpful, thanks! Can you give me an example of when I might use useEffect?' },
        // { id: 6, role: 'assistant', content: 'Certainly! Here are some common use cases for useEffect:\n\n1. Fetching data from an API when a component mounts:\n\nuseEffect(() => {\n  const fetchData = async () => {\n    const response = await fetch(\'https://api.example.com/data\');\n    const data = await response.json();\n    setData(data);\n  };\n  fetchData();\n}, []); // Empty array means this effect runs once on mount\n\n2. Updating the document title based on component state:\n\nuseEffect(() => {\n  document.title = `You clicked ${count} times`;\n}, [count]); // This effect runs when count changes\n\n3. Setting up and cleaning up subscriptions or timers:\n\nuseEffect(() => {\n  const timer = setInterval(() => {\n    setSeconds(s => s + 1);\n  }, 1000);\n  return () => clearInterval(timer);\n}, []); // This effect sets up the timer on mount and cleans it up on unmount\n\nThese are just a few examples. useEffect is very versatile and can be used for many different side effects in your components.' },
        // { id: 7, role: 'user', content: 'Great explanation! One more question: how do I avoid infinite loops with useEffect?' },
        // { id: 8, role: 'assistant', content: 'Excellent question! Avoiding infinite loops with useEffect is crucial for maintaining good performance. Here are some tips:\n\n1. Always include a dependency array:\n   If you don\'t provide a second argument to useEffect, it will run after every render, which can lead to infinite loops if you\'re updating state inside the effect.\n\n   useEffect(() => {\n     // This will cause an infinite loop!\n     setCount(count + 1);\n   }); // No dependency array\n\n2. Correctly specify your dependencies:\n   Make sure to include all variables from the component scope that the effect uses. The ESLint plugin for React Hooks can help you catch missing dependencies.\n\n   useEffect(() => {\n     setFullName(`${firstName} ${lastName}`);\n   }, [firstName, lastName]); // Both firstName and lastName are dependencies\n\n3. Use functional updates for state:\n   If you\'re updating state based on its previous value, use the functional update form to avoid needing the state variable as a dependency.\n\n   useEffect(() => {\n     setCount(prevCount => prevCount + 1);\n   }, []); // No need to include count as a dependency\n\n4. Use useCallback or useMemo for function dependencies:\n   If your effect depends on a function, wrap that function in useCallback to avoid unnecessary effect runs.\n\n   const fetchData = useCallback(() => {\n     // fetch data\n   }, [/* dependencies */]);\n\n   useEffect(() => {\n     fetchData();\n   }, [fetchData]);\n\n5. Use useRef for mutable values that shouldn\'t trigger re-renders:\n   If you need to keep track of a value but don\'t want changes to it to cause re-renders, use useRef.\n\n   const mountedRef = useRef(false);\n   useEffect(() => {\n     if (!mountedRef.current) {\n       mountedRef.current = true;\n       // do something only on mount\n     }\n   }, []);\n\nBy following these guidelines, you can effectively use useEffect while avoiding infinite loops and unnecessary re-renders.' },
    ],
}

export function ChatWindow() {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [state, formAction] = useFormState(prompt, { error: "", answer: "", context: [] });
    const [messages, setMessages] = useState([...data.chatMessages]);
    const [inputValue, setInputValue] = useState("");

    useEffect(() => {
        console.log("state", state);
        if (state.answer !== "") {
            setMessages(prev => [...prev, {
                id: Math.max(...prev.map(m => m.id)) + 1,
                role: 'assistant',
                content: state.answer
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

    const handleSubmit = async (payload: FormData) => {
        const prompt = payload.get("prompt")?.toString() ?? "";
        if (!prompt.trim()) return; // Don't submit empty messages
        
        // Generate a unique ID for the message
        const newMessageId = messages.length > 0 
            ? Math.max(...messages.map(m => m.id)) + 1 
            : 1;
        
        // Immediately update UI with user message
        setMessages(prev => [...prev, {
            id: newMessageId,
            role: 'user',
            content: prompt
        }]);

        // Then process the form action
        formAction(payload);
    }

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("prompt", inputValue);
        handleSubmit(formData);
        setInputValue("");
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const formData = new FormData();
            formData.append("prompt", inputValue);
            handleSubmit(formData);
            setInputValue("");
        }
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden p-4">
            <Card className="flex flex-col flex-1 overflow-hidden b">
                <CardHeader className="shrink-0 ">
                    <h2 className="text-2xl font-bold">Chat</h2>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-4">
                    <ScrollArea className="h-full" ref={scrollAreaRef}>
                        <div className="flex flex-col p-4">
                            {messages.map(m => (
                                <div key={m.id} className="mb-4 flex flex-col">
                                    <div className={`flex items-center ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`rounded-lg p-3 ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                            <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                                        </div>
                                    </div>
                                    <span className="mt-1 text-xs text-muted-foreground">
                                        {m.role === 'user' ? 'You' : 'AI'} • {new Date().toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="shrink-0 pt-4">
                    <form 
                        className="flex w-full items-start space-x-2" 
                        onSubmit={onSubmit}
                    >
                        <Textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type your message here..."
                            className="flex-1 min-h-[38px]"
                            rows={1}
                            onKeyDown={onKeyDown}
                        />
                        <Button type="submit" size="icon" className="shrink-0">
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Send</span>
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    )
}
