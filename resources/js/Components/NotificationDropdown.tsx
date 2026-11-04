import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { 
    Bell, 
    Calendar, 
    UserCheck, 
    Stethoscope, 
    Pill, 
    CreditCard, 
    CheckCheck, 
    ExternalLink, 
    Loader2 
} from 'lucide-react';

interface NotificationItem {
    MaThongBao: number;
    MaTaiKhoan: number;
    LoaiThongBao: string;
    TieuDe: string;
    NoiDung: string;
    DuongDan?: string | null;
    DaDoc: boolean;
    ThoiGianDoc?: string | null;
    NgayTao: string;
}

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch unread count
    const fetchUnreadCount = async () => {
        try {
            const res = await axios.get('/notifications/unread-count');
            if (res.data?.success) {
                setUnreadCount(res.data.count);
            }
        } catch {
            // Im lặng nếu chưa đăng nhập hoặc lỗi kết nối tạm thời
        }
    };

    // Fetch notifications list
    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/notifications?limit=15');
            if (res.data?.success) {
                setNotifications(res.data.data);
                setUnreadCount(res.data.unread_count);
            }
        } catch {
            // Ignore error
        } finally {
            setLoading(false);
        }
    };

    // Polling định kỳ 30 giây lấy unread count
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    // Khi mở dropdown, load danh sách thông báo
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    // Xử lý click ra ngoài để đóng dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Đánh dấu 1 thông báo đã đọc
    const handleMarkAsRead = async (notification: NotificationItem) => {
        if (!notification.DaDoc) {
            try {
                await axios.post(`/notifications/${notification.MaThongBao}/read`);
                setNotifications((prev) =>
                    prev.map((item) =>
                        item.MaThongBao === notification.MaThongBao ? { ...item, DaDoc: true } : item
                    )
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            } catch {
                // Ignore error
            }
        }

        if (notification.DuongDan) {
            setIsOpen(false);
            router.visit(notification.DuongDan);
        }
    };

    // Đánh dấu tất cả đã đọc
    const handleMarkAllAsRead = async () => {
        try {
            await axios.post('/notifications/read-all');
            setNotifications((prev) => prev.map((item) => ({ ...item, DaDoc: true })));
            setUnreadCount(0);
        } catch {
            // Ignore error
        }
    };

    // Render icon theo loại thông báo
    const renderIcon = (type: string) => {
        switch (type) {
            case 'LICH_HEN':
                return <Calendar className="w-4 h-4 text-blue-500" />;
            case 'TIEP_NHAN':
                return <UserCheck className="w-4 h-4 text-purple-500" />;
            case 'KHAM_BENH':
                return <Stethoscope className="w-4 h-4 text-teal-500" />;
            case 'DON_THUOC':
                return <Pill className="w-4 h-4 text-emerald-500" />;
            case 'HOA_DON':
            case 'THANH_TOAN':
                return <CreditCard className="w-4 h-4 text-amber-500" />;
            default:
                return <Bell className="w-4 h-4 text-primary" />;
        }
    };

    // Format thời gian hiển thị
    const formatTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

            if (diffMinutes < 1) return 'Vừa xong';
            if (diffMinutes < 60) return `${diffMinutes} phút trước`;
            if (diffHours < 24) return `${diffHours} giờ trước`;

            return date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Button Chuông thông báo */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:text-primary transition-colors rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-label="Thông báo hệ thống"
                id="btn-notification-bell"
            >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white shadow-sm animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div 
                    id="dropdown-notification-menu"
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800">Thông báo</span>
                            {unreadCount > 0 && (
                                <span className="text-xs bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount} mới
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllAsRead}
                                className="text-xs text-primary hover:text-primary-hover font-semibold flex items-center gap-1 transition-colors"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Đã đọc tất cả
                            </button>
                        )}
                    </div>

                    {/* Danh sách thông báo */}
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                        {loading && notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                                <span className="text-xs">Đang tải thông báo...</span>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2 text-slate-400">
                                    <Bell className="w-6 h-6 stroke-[1.5]" />
                                </div>
                                <p className="text-sm font-bold text-slate-600">Không có thông báo nào</p>
                                <p className="text-xs text-slate-400 mt-0.5">Các cập nhật quan trọng sẽ hiển thị ở đây</p>
                            </div>
                        ) : (
                            notifications.map((item) => (
                                <div
                                    key={item.MaThongBao}
                                    onClick={() => handleMarkAsRead(item)}
                                    className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 text-left relative ${
                                        !item.DaDoc ? 'bg-blue-50/40' : ''
                                    }`}
                                >
                                    {/* Icon Container */}
                                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                                        {renderIcon(item.LoaiThongBao)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-1">
                                            <p className={`text-xs ${!item.DaDoc ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'} truncate`}>
                                                {item.TieuDe}
                                            </p>
                                            {!item.DaDoc && (
                                                <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1"></span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                                            {item.NoiDung}
                                        </p>
                                        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                                            <span>{formatTime(item.NgayTao)}</span>
                                            {item.DuongDan && (
                                                <span className="text-primary flex items-center gap-0.5 font-medium hover:underline">
                                                    Chi tiết <ExternalLink className="w-2.5 h-2.5" />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center">
                        <span className="text-[11px] text-slate-400">
                            Hệ thống tự động cập nhật thông báo mỗi 30s
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
