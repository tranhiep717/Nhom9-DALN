<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * GIAI ĐOẠN 1: Mở rộng bảng luot_kham ở trạng thái NULLABLE an toàn
     * Tuyệt đối không thêm cột NOT NULL trực tiếp để không làm hỏng dữ liệu lịch sử.
     */
    public function up(): void
    {
        Schema::table('luot_kham', function (Blueprint $table) {
            // 1. Chuyển đổi MaBacSi sang NULLABLE (cho phép bệnh nhân trực tiếp chưa phân bác sĩ)
            $table->integer('MaBacSi')->nullable()->change();

            // 2. Thêm các cột phục vụ Hybrid Queue (Tất cả ban đầu đều NULLABLE)
            $table->date('NgayKham')->nullable()->after('MaLuotKham');
            $table->string('LoaiHangDoi', 20)->nullable()->after('NgayKham'); // DAT_LICH / TRUC_TIEP
            $table->string('SoPhieu', 30)->nullable()->after('LoaiHangDoi');   // VD: NTQ-C85-001, TM-C12-002
            $table->integer('STTTrongNgay')->nullable()->after('SoPhieu');      // Số thứ tự tăng dần trong ca
            $table->integer('MaChuyenKhoa')->nullable()->after('STTTrongNgay'); // Khóa ngoại chuyen_khoa
            $table->integer('MaCaKham')->nullable()->after('MaChuyenKhoa');     // Khóa ngoại ca_kham
            $table->tinyInteger('MucUuTien')->nullable()->default(3)->after('MaCaKham'); // 0: P0, 1: P1, 2: P2, 3: P3
            $table->dateTime('ThoiGianVaoHang')->nullable()->after('MucUuTien'); // Thời điểm check-in thực tế
            $table->dateTime('ThoiGianGoiKham')->nullable()->after('ThoiGianVaoHang'); // Thời điểm bác sĩ bấm gọi

            // 3. Quản lý giám sát người xác nhận ưu tiên
            $table->integer('NguoiXacNhanUuTien')->nullable()->after('ThoiGianGoiKham'); // FK tai_khoan(MaTaiKhoan)
            $table->string('LyDoUuTien', 255)->nullable()->after('NguoiXacNhanUuTien'); // Lý do ưu tiên

            // 4. Khóa ngoại tham chiếu
            $table->foreign('MaChuyenKhoa', 'fk_lk_chuyen_khoa')
                  ->references('MaChuyenKhoa')->on('chuyen_khoa')
                  ->onDelete('restrict');

            $table->foreign('MaCaKham', 'fk_lk_ca_kham')
                  ->references('MaCaKham')->on('ca_kham')
                  ->onDelete('restrict');

            $table->foreign('NguoiXacNhanUuTien', 'fk_lk_nguoi_xac_nhan')
                  ->references('MaTaiKhoan')->on('tai_khoan')
                  ->onDelete('set null');

            // 5. Index tìm kiếm hàng đợi
            $table->index(['NgayKham', 'MaCaKham', 'MaChuyenKhoa', 'TrangThai'], 'idx_lk_queue_search');

            // 6. Ràng buộc UNIQUE chống cấp trùng số thứ tự trong cùng phạm vi ca khám
            // Lưu ý MySQL InnoDB: Cho phép nhiều bản ghi có NULL (tương thích tuyệt đối với 18 bản ghi cũ theo Phương án C)
            $table->unique(['NgayKham', 'MaCaKham', 'MaChuyenKhoa', 'STTTrongNgay'], 'uq_lk_queue_scope_stt');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('luot_kham', function (Blueprint $table) {
            // Xóa khóa ngoại trước
            $table->dropForeign('fk_lk_chuyen_khoa');
            $table->dropForeign('fk_lk_ca_kham');
            $table->dropForeign('fk_lk_nguoi_xac_nhan');

            // Xóa unique index và index thường
            $table->dropUnique('uq_lk_queue_scope_stt');
            $table->dropIndex('idx_lk_queue_search');

            // Xóa các cột đã thêm
            $table->dropColumn([
                'NgayKham',
                'LoaiHangDoi',
                'SoPhieu',
                'STTTrongNgay',
                'MaChuyenKhoa',
                'MaCaKham',
                'MucUuTien',
                'ThoiGianVaoHang',
                'ThoiGianGoiKham',
                'NguoiXacNhanUuTien',
                'LyDoUuTien',
            ]);

            // Chuyển lại MaBacSi sang NOT NULL (nếu an toàn)
            $table->integer('MaBacSi')->nullable(false)->change();
        });
    }
};
