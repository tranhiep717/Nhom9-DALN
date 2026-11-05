import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface AdminPaginationProps {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    pageSizeOptions?: number[];
    className?: string;
}

export default function AdminPagination({
    currentPage,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100],
    className = '',
}: AdminPaginationProps) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

    const from = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
    const to = Math.min(safeCurrentPage * pageSize, totalItems);

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (safeCurrentPage <= 4) {
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (safeCurrentPage >= totalPages - 3) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                pages.push(safeCurrentPage - 1);
                pages.push(safeCurrentPage);
                pages.push(safeCurrentPage + 1);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    if (totalItems <= 0) {
        return null;
    }

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border-t border-gray-100 ${className}`}>
            <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>
                    Hiển thị <span className="font-semibold text-gray-900">{from}</span> - <span className="font-semibold text-gray-900">{to}</span> trên tổng số <span className="font-semibold text-gray-900">{totalItems}</span> bản ghi
                </span>
                {onPageSizeChange && (
                    <div className="flex items-center gap-1.5 ml-2">
                        <span className="text-xs text-gray-500">Cỡ trang:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                onPageSizeChange(Number(e.target.value));
                                onPageChange(1);
                            }}
                            className="text-xs font-medium py-1 px-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                            {pageSizeOptions.map((size) => (
                                <option key={size} value={size}>
                                    {size} / trang
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => onPageChange(1)}
                    disabled={safeCurrentPage === 1}
                    aria-label="Trang đầu"
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => onPageChange(safeCurrentPage - 1)}
                    disabled={safeCurrentPage === 1}
                    aria-label="Trang trước"
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1 mx-1">
                    {getPageNumbers().map((p, idx) =>
                        typeof p === 'number' ? (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => onPageChange(p)}
                                className={`min-w-[32px] h-8 px-2 text-xs font-semibold rounded-lg transition-colors ${
                                    p === safeCurrentPage
                                        ? 'bg-teal-600 text-white shadow-sm'
                                        : 'text-gray-700 hover:bg-gray-100 border border-gray-200'
                                }`}
                            >
                                {p}
                            </button>
                        ) : (
                            <span key={idx} className="px-1 text-gray-400 text-xs">
                                {p}
                            </span>
                        )
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => onPageChange(safeCurrentPage + 1)}
                    disabled={safeCurrentPage === totalPages}
                    aria-label="Trang sau"
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => onPageChange(totalPages)}
                    disabled={safeCurrentPage === totalPages}
                    aria-label="Trang cuối"
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronsRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
