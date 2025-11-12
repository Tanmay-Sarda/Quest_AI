"use client"

import React from 'react'
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlay, faLock, faLockOpen, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import { get } from 'mongoose';
const page = () => {
    const router = useRouter();
    const { username } = useParams();
    const [publicstories, setPublicstories] = useState([]);

    useEffect(() => {
      getpublicstories();
    }, [])

    const getpublicstories = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_HOST}/story/publicstories`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (!res.ok) {
                throw new Error("Failed to fetch public stories");
            }
            const data = await res.json();
            console.log("Public stories fetched:", data.data);
            setPublicstories(data.data);
        } catch (err) {
            console.error("Error fetching public stories:", err);
        }
    };

    
    
    // Toast notification function
    const showToast = (message, duration = 2500) => {
        const toast = document.createElement("div");
        toast.className = "toast show";
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 500);
        }, duration);
    };
    const StoryCard = ({ story, type }) => (
        <div
            className="terminal-border relative grid grid-cols-1 gap-3 items-center bg-[#3c3b3b]"
            style={{ transition: "all 0.3s ease" }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 0 20px rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "";
                e.currentTarget.style.transform = "scale(1)";
            }}
        >
            <div className="terminal-content flex bg-[#262626]">
                <div className="flex flex-col w-full">
                    <div className=" flex gap-2  justify-center ">
                        <p className="text-2xl font-mediium text-green-500">{story.title}</p>
                    </div>
                    <div className="flex gap-2">
                        <h2 className="text-gray-500">Description: </h2>
                        <p>{story.description}</p>
                    </div>
                    <div className="flex gap-2">
                        <h2 className="text-gray-500">Owner: </h2>
                        <p> {story.email} </p>
                    </div>
                    <div className="flex gap-2">
                        <h2 className="text-gray-500">Character: </h2>
                        <p> {story.character} </p>
                    </div>
                </div>
                {/* Buttons */}

                <div className=" absolute right-5 top-4 flex gap-2">
                    {type === "ongoing" && (
                        <button
                            title="Continue Story"
                            className="text-green-500 hover:text-green-600 text-lg transition-all duration-200 hover:scale-125"
                            onClick={() => {
                                showToast("Loading ChatBox...");
                                router.push(`/ChatBox/${username}/${story._id} True`)
                            }}
                        >
                            <FontAwesomeIcon className="text-xl" icon={faPlay} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div>
            <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-b from-[#0a0a14] via-[#0b0f1c] to-[#0a0a14] text-white p-5">
                <h1 className="text-4xl font-bold mb-8 mt-10">Public Stories</h1>
                <div className="grid grid-cols-2 gap-6 w-full max-w-7xl">
                    {publicstories.length === 0 ? (
                        <p className="text-center col-span-full">No public stories available.</p>
                    ) : (
                        publicstories.map((story) => (
                            <StoryCard key={story._id} story={story} type="ongoing" />
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

export default page
