import React, { useState, useEffect, useRef } from 'react';
import { 
    Bot, 
    X, 
    Send, 
    Sparkles, 
    AlertCircle, 
    ChevronDown, 
    Loader2, 
    Clock, 
    Calendar, 
    Building2,
    ShieldAlert
} from 'lucide-react';
import axios from 'axios';

interface Message {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    time: string;
    source?: string;
}

export default function AiChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            sender: 'ai',
            text: 'Xin chào! Tôi là Trợ lý y tế ảo SmartCare AI. Tôi có thể giúp bạn giải đáp thông tin phòng khám, giờ làm việc, chuyên khoa hoặc hướng dẫn đặt lịch khám.',
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        }
    ]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (textToSend?: string) => {
        const query = (textToSend || input).trim();
        if (!query || loading) return;

        const userMsg: Message = {
            id: 'u_' + Date.now(),
            sender: 'user',
            text: query,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await axios.post('/ai/chat', {
                message: query,
                conversation_id: conversationId,
            });

            if (res.data.success) {
                if (res.data.conversation_id) {
                    setConversationId(res.data.conversation_id);
                }

                const aiMsg: Message = {
                    id: 'ai_' + Date.now(),
                    sender: 'ai',
                    text: res.data.reply,
                    time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                    source: res.data.source,
                };
                setMessages((prev) => [...prev, aiMsg]);
            }
        } catch (error: any) {
            const errorMsg: Message = {
                id: 'err_' + Date.now(),
                sender: 'ai',
                text: 'Hệ thống AI hiện đang bận hoặc có sự cố kết nối. Vui lòng thử lại sau ít phút hoặc liên hệ hotline phòng khám 1900 6868.',
                time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const quickQuestions = [
        { label: 'Giờ làm việc phòng khám?', text: 'Phòng khám làm việc vào những giờ nào?' },
        { label: 'Cách đặt lịch khám?', text: 'Hướng dẫn tôi cách đặt lịch khám trực tuyến?' },
        { label: 'Các chuyên khoa?', text: 'Phòng khám có những chuyên khoa nào?' },
    ];

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Hộp thoại Chat Widget */}
            {isOpen && (
                <div className="mb-4 w-[360px] sm:w-[420px] h-[560px] max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-sky-600 p-4 text-white flex items-center justify-between shrink-0 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h3 className="font-bold text-sm tracking-tight">SmartCare AI Assistant</h3>
                                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-indigo-100">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span>Trợ lý y tế thông minh 24/7</span>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                            aria-label="Đóng chat"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Disclaimer Y tế */}
                    <div className="bg-amber-50 px-3.5 py-2 border-b border-amber-200/60 flex items-start gap-2 shrink-0">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-800 leading-tight">
                            Thông tin từ AI chỉ mang tính chất tham khảo, <strong className="font-semibold">không thay thế chẩn đoán bác sĩ</strong>.
                        </p>
                    </div>

                    {/* Danh sách tin nhắn */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
                        {messages.map((m) => (
                            <div 
                                key={m.id} 
                                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div 
                                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
                                        m.sender === 'user'
                                            ? 'bg-indigo-600 text-white rounded-tr-none'
                                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                                    }`}
                                >
                                    {m.text}
                                </div>
                                {m.sender === 'ai' && m.source && (
                                    <div className="mt-1 flex items-center gap-1">
                                        {m.source === 'gemini_api' && (
                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 flex items-center gap-1">
                                                <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                                                <span>Google Gemini 3.8 Flash</span>
                                            </span>
                                        )}
                                        {m.source === 'local_knowledge_base' && (
                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                                                <Building2 className="w-2.5 h-2.5 text-slate-500" />
                                                <span>Cơ sở tri thức FAQ nội bộ</span>
                                            </span>
                                        )}
                                        {m.source === 'system_fallback_unconfigured' && (
                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                                                <AlertCircle className="w-2.5 h-2.5 text-amber-500" />
                                                <span>SmartCare Clinic (Chế độ nội bộ)</span>
                                            </span>
                                        )}
                                        {m.source === 'system_fallback_safety_blocked' && (
                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                                                <ShieldAlert className="w-2.5 h-2.5 text-rose-500" />
                                                <span>Giới hạn an toàn y tế</span>
                                            </span>
                                        )}
                                        {m.source === 'system_fallback_on_api_error' && (
                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
                                                <AlertCircle className="w-2.5 h-2.5 text-orange-500" />
                                                <span>Phản hồi dự phòng y tế</span>
                                            </span>
                                        )}
                                    </div>
                                )}
                                <span className="text-[10px] text-slate-400 mt-0.5 px-1">
                                    {m.time}
                                </span>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex items-center gap-2 text-slate-400 text-xs py-2 bg-white px-3.5 rounded-2xl w-fit border border-slate-200">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                                <span>SmartCare AI đang xử lý...</span>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Gợi ý câu hỏi nhanh */}
                    <div className="px-3 pt-2 pb-1 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
                        {quickQuestions.map((q, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(q.text)}
                                disabled={loading}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-medium whitespace-nowrap transition-colors shrink-0 disabled:opacity-50"
                            >
                                {q.label}
                            </button>
                        ))}
                    </div>

                    {/* Cảnh báo bảo mật người dùng */}
                    <div className="px-3 py-1 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 shrink-0 text-[10px] text-slate-500">
                        <AlertCircle className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">Để bảo mật, vui lòng không chia sẻ CCCD, BHYT hoặc thông tin bệnh án nhạy cảm.</span>
                    </div>

                    {/* Form gửi tin nhắn */}
                    <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                        <div className="flex items-center gap-2 bg-slate-100 rounded-2xl px-3 py-1.5 border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Hỏi giờ khám, chuyên khoa, đặt lịch..."
                                className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-0 p-1"
                                disabled={loading}
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || loading}
                                className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0 shadow-sm"
                                aria-label="Gửi câu hỏi"
                            >
                                <Send className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Nút bật tắt Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-full shadow-xl transition-all duration-300 font-semibold text-sm ${
                    isOpen
                        ? 'bg-slate-900 text-white hover:bg-slate-800'
                        : 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white hover:scale-105 hover:shadow-indigo-500/25'
                }`}
            >
                {isOpen ? (
                    <>
                        <X className="w-5 h-5" />
                        <span>Đóng</span>
                    </>
                ) : (
                    <>
                        <div className="relative">
                            <Bot className="w-5 h-5 text-white" />
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white"></span>
                        </div>
                        <span>Trợ lý SmartCare AI</span>
                        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                    </>
                )}
            </button>
        </div>
    );
}
