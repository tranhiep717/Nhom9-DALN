-- ======================================================================
-- SMARTCARE HYBRID QUEUE — BỘ TRUY VẤN KIỂM ĐỊNH TRƯỚC VÀ SAU MIGRATION
-- File: database/sql/verify_hybrid_queue_pre_post_migration.sql
-- Phiên bản: Phase 2.1 (Phương án C: Giữ MaCaKham = NULL cho 18 ca trực tiếp cũ)
-- Môi trường: MySQL 8.0+ / InnoDB / Database: phong_kham_thong_minh
-- Quy tắc: TẤT CẢ CÁC CÂU LỆNH ĐỀU LÀ SELECT (READ-ONLY 100%)
-- ======================================================================

-- ----------------------------------------------------------------------
-- PHẦN 1: KIỂM TRA DỮ LIỆU HIỆN CÓ TRƯỚC KHI CHẠY MIGRATION (PRE-MIGRATION)
-- ----------------------------------------------------------------------

-- 1.1. Đếm tổng số bản ghi và phân bố loại lượt khám hiện tại
SELECT 
    COUNT(*) AS TongSoBanGhi,
    COUNT(CASE WHEN MaLichHen IS NOT NULL THEN 1 END) AS SoLuotDatLich,
    COUNT(CASE WHEN MaLichHen IS NULL THEN 1 END) AS SoLuotTrucTiep,
    MIN(ThoiGianTiepNhan) AS BanGhiSomNhat,
    MAX(ThoiGianTiepNhan) AS BanGhiMoiNhat
FROM luot_kham;
-- Kỳ vọng: TongSoBanGhi = 23, SoLuotDatLich = 5, SoLuotTrucTiep = 18

-- 1.2. Kiểm tra chi tiết 5 bản ghi Đặt lịch trước (Đủ căn cứ ca khám lịch sử)
SELECT 
    lk.MaLuotKham,
    lk.MaLichHen,
    lk.MaBenhNhan,
    lk.MaBacSi,
    lh.MaCaKham,
    llv.NgayLamViec,
    bs.MaChuyenKhoa,
    lk.ThoiGianTiepNhan,
    lk.TrangThai
FROM luot_kham lk
JOIN lich_hen lh ON lk.MaLichHen = lh.MaLichHen
JOIN ca_kham ck ON lh.MaCaKham = ck.MaCaKham
JOIN lich_lam_viec llv ON ck.MaLichLamViec = llv.MaLichLamViec
JOIN bac_si bs ON lk.MaBacSi = bs.MaBacSi
WHERE lk.MaLichHen IS NOT NULL
ORDER BY lk.MaLuotKham ASC;
-- Kỳ vọng: 5 dòng trả về (LK #1, #156, #211, #214, #236)

-- 1.3. Kiểm tra 18 bản ghi Khám trực tiếp (Phương án C: Không có ca khám lịch sử)
SELECT 
    lk.MaLuotKham,
    lk.MaBenhNhan,
    lk.MaBacSi,
    bs.MaChuyenKhoa,
    DATE(lk.ThoiGianTiepNhan) AS NgayTiepNhan,
    TIME(lk.ThoiGianTiepNhan) AS GioTiepNhan,
    lk.TrangThai
FROM luot_kham lk
LEFT JOIN bac_si bs ON lk.MaBacSi = bs.MaBacSi
WHERE lk.MaLichHen IS NULL
ORDER BY lk.MaLuotKham ASC;
-- Kỳ vọng: 18 dòng trả về

-- ----------------------------------------------------------------------
-- PHẦN 2: KIỂM TRA SAU KHI CHẠY MIGRATION CẤU TRÚC (POST-SCHEMA AUDIT)
-- ----------------------------------------------------------------------

-- 2.1. Xác nhận 11 cột mới đã được tạo và MaCaKham ở trạng thái NULLABLE an toàn
SELECT 
    COLUMN_NAME, 
    COLUMN_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'phong_kham_thong_minh'
  AND TABLE_NAME = 'luot_kham'
  AND COLUMN_NAME IN (
      'NgayKham', 'LoaiHangDoi', 'SoPhieu', 'STTTrongNgay', 
      'MaChuyenKhoa', 'MaCaKham', 'MucUuTien', 'ThoiGianVaoHang', 
      'ThoiGianGoiKham', 'NguoiXacNhanUuTien', 'LyDoUuTien', 'MaBacSi'
  )
ORDER BY ORDINAL_POSITION;
-- Kỳ vọng: MaCaKham có IS_NULLABLE = 'YES', MaBacSi có IS_NULLABLE = 'YES'

-- 2.2. Kiểm tra bảng hang_doi_counter đã được tạo đúng cấu trúc
SELECT 
    COLUMN_NAME, 
    COLUMN_TYPE, 
    IS_NULLABLE, 
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'phong_kham_thong_minh'
  AND TABLE_NAME = 'hang_doi_counter'
ORDER BY ORDINAL_POSITION;

-- 2.3. Kiểm tra ràng buộc UNIQUE uq_lk_queue_scope_stt trên luot_kham
SELECT 
    CONSTRAINT_NAME, 
    TABLE_NAME, 
    COLUMN_NAME, 
    ORDINAL_POSITION
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'phong_kham_thong_minh'
  AND TABLE_NAME = 'luot_kham'
  AND CONSTRAINT_NAME = 'uq_lk_queue_scope_stt'
ORDER BY ORDINAL_POSITION;
-- Kỳ vọng: 4 dòng: NgayKham, MaCaKham, MaChuyenKhoa, STTTrongNgay

-- ----------------------------------------------------------------------
-- PHẦN 3: KIỂM TRA SAU KHI BACKFILL DỮ LIỆU THEO PHƯƠNG ÁN C
-- ----------------------------------------------------------------------

-- 3.1. Xác nhận 5 bản ghi Nhóm 1 (Đặt lịch) đã có đầy đủ NgayKham, MaCaKham, SoPhieu, STT
SELECT 
    MaLuotKham, 
    MaLichHen, 
    LoaiHangDoi, 
    NgayKham, 
    MaCaKham, 
    MaChuyenKhoa, 
    MucUuTien, 
    STTTrongNgay, 
    SoPhieu
FROM luot_kham
WHERE MaLichHen IS NOT NULL;
-- Kỳ vọng: 5 dòng, tất cả các trường đều NOT NULL, LoaiHangDoi = 'DAT_LICH', MucUuTien = 2

-- 3.2. Xác nhận 18 bản ghi Nhóm 2 (Trực tiếp) tuân thủ đúng Phương án C: MaCaKham = NULL
SELECT 
    MaLuotKham, 
    LoaiHangDoi, 
    NgayKham, 
    MaChuyenKhoa, 
    MaCaKham, 
    STTTrongNgay, 
    SoPhieu, 
    MucUuTien
FROM luot_kham
WHERE MaLichHen IS NULL;
-- Kỳ vọng: 18 dòng, NgayKham NOT NULL, MaChuyenKhoa NOT NULL, LoaiHangDoi = 'TRUC_TIEP', 
--          MaCaKham IS NULL, STTTrongNgay IS NULL, SoPhieu IS NULL

-- 3.3. Kiểm tra tính đồng bộ giữa MAX(STTTrongNgay) và bảng hang_doi_counter
-- CHỈ KIỂM TRA TRÊN CÁC CA KHÁM CÓ MaCaKham IS NOT NULL
SELECT 
    lk.NgayKham,
    lk.MaCaKham,
    lk.MaChuyenKhoa,
    MAX(lk.STTTrongNgay) AS MaxSTTTrongLuotKham,
    hdc.SoHienTai AS SoHienTaiTrongCounter,
    CASE 
        WHEN MAX(lk.STTTrongNgay) = hdc.SoHienTai THEN 'DONG_BO_HOAN_HAO'
        ELSE 'LECH_DU_LIEU'
    END AS KetQua
FROM luot_kham lk
JOIN hang_doi_counter hdc 
  ON lk.NgayKham = hdc.NgayKham 
 AND lk.MaCaKham = hdc.MaCaKham 
 AND lk.MaChuyenKhoa = hdc.MaChuyenKhoa
WHERE lk.MaCaKham IS NOT NULL
GROUP BY lk.NgayKham, lk.MaCaKham, lk.MaChuyenKhoa, hdc.SoHienTai;
-- Kỳ vọng: 100% các dòng đều là 'DONG_BO_HOAN_HAO'

-- 3.4. Kiểm tra phân biệt số phiếu hiển thị giữa các ca khám (LK #156 vs LK #214)
SELECT 
    MaLuotKham, 
    MaCaKham, 
    MaChuyenKhoa, 
    STTTrongNgay, 
    SoPhieu
FROM luot_kham
WHERE MaLuotKham IN (156, 214, 236)
ORDER BY MaLuotKham ASC;
-- Kỳ vọng:
-- LK #156: NTQ-C76-001 (Ca 76)
-- LK #214: NTQ-C85-001 (Ca 85) -> KHÔNG CÒN TRÙNG VỚI LK #156
-- LK #236: NTQ-C85-002 (Ca 85)

-- ----------------------------------------------------------------------
-- PHẦN 4: KIỂM TRA ĐIỀU KIỆN TIÊN QUYẾT TRƯỚC KHI THÊM UNIQUE CONSTRAINTS
-- ----------------------------------------------------------------------

-- 4.1. Kiểm tra xem có trùng lặp số thứ tự trong cùng ca khám không
SELECT 
    NgayKham, 
    MaCaKham, 
    MaChuyenKhoa, 
    STTTrongNgay, 
    COUNT(*) AS SoLuongTrung
FROM luot_kham
WHERE MaCaKham IS NOT NULL AND STTTrongNgay IS NOT NULL
GROUP BY NgayKham, MaCaKham, MaChuyenKhoa, STTTrongNgay
HAVING COUNT(*) > 1;
-- Kỳ vọng: 0 dòng trả về (Không có bất kỳ trùng lặp nào)

-- 4.2. Kiểm tra xem có trùng MaLichHen không
SELECT 
    MaLichHen, 
    COUNT(*) AS SoLuongTrung
FROM luot_kham
WHERE MaLichHen IS NOT NULL
GROUP BY MaLichHen
HAVING COUNT(*) > 1;
-- Kỳ vọng: 0 dòng trả về
