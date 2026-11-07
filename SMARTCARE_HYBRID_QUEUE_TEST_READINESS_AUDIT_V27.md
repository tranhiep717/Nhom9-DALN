# SMARTCARE HYBRID QUEUE â€“ TEST READINESS AUDIT V2.7
## BĂO CĂO KIá»‚M Äá»NH TĂNH NHáº¤T QUĂN THIáº¾T Káº¾: PHĂ‚N TĂCH CURRENT CODE VĂ€ TARGET DESIGN, TRANSACTION SAFETY VĂ€ GIá»I Háº N KHáº²NG Äá»NH DEADLOCK (B-49 Äáº¾N B-54)

> **TĂ i liá»‡u tham chiáº¿u:**  
> - [SMARTCARE_HYBRID_QUEUE_TEST_READINESS_AUDIT_V26.md](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/SMARTCARE_HYBRID_QUEUE_TEST_READINESS_AUDIT_V26.md)  
> - [SMARTCARE_HYBRID_QUEUE_TEST_CASE_MATRIX_V26.md](file:///c:/Users/admin/quanlytkbieu-app/Nhom9-DALN/SMARTCARE_HYBRID_QUEUE_TEST_CASE_MATRIX_V26.md)  
> **PhiĂªn báº£n:** 2.7 (Current vs Target Consistency, Transaction Safety & Deadlock Rigor Audit)  
> **NgĂ y láº­p:** 04/11/2026  
> **MĂ´i trÆ°á»ng Database xĂ¡c thá»±c:** MySQL **8.0.26**, Storage Engine **InnoDB 100%**, Default Isolation **REPEATABLE-READ**, Laravel **12.0**  
> **Quy táº¯c an toĂ n báº¥t biáº¿n:** READ-ONLY 100%. KHĂ”NG sá»­a code á»©ng dá»¥ng, KHĂ”NG táº¡o/sá»­a migration, KHĂ”NG cháº¡y SQL ghi dá»¯ liá»‡u, KHĂ”NG táº¡o database clone, KHĂ”NG thay Ä‘á»•i database chĂ­nh `phong_kham_thong_minh`.

---

### Há»† THá»NG PHĂ‚N LOáº I TRáº NG THĂI MINH Báº CH (4 Cáº¤P Äá»˜)

Má»i nháº­n Ä‘á»‹nh ká»¹ thuáº­t trong bĂ¡o cĂ¡o nĂ y báº¯t buá»™c tuĂ¢n thá»§ 4 cáº¥p Ä‘á»™ phĂ¢n loáº¡i minh báº¡ch:
1. **`CURRENT CODE VERIFIED`**: ÄĂ£ Ä‘á»c vĂ  Ä‘á»‘i soĂ¡t trá»±c tiáº¿p tá»«ng file, class, method vĂ  dĂ²ng code hiá»‡n cĂ³ trong repository.
2. **`LIVE SCHEMA VERIFIED`**: ÄĂ£ Ä‘á»‘i chiáº¿u trá»±c tiáº¿p `INFORMATION_SCHEMA` trĂªn live database `phong_kham_thong_minh` (MySQL 8.0.26).
3. **`TARGET DESIGN SPECIFIED`**: Äáº·c táº£ ká»¹ thuáº­t má»¥c tiĂªu dá»± kiáº¿n sáº½ Ä‘Æ°á»£c bá»• sung/triá»ƒn khai trong giai Ä‘oáº¡n tiáº¿p theo (chÆ°a cĂ³ trong code/schema hiá»‡n táº¡i).
4. **`THEORETICAL ANALYSIS`**: Suy luáº­n phĂ¢n tĂ­ch ká»¹ thuáº­t dá»±a trĂªn nguyĂªn lĂ½ hoáº¡t Ä‘á»™ng cá»§a MySQL 8.0 InnoDB Engine (Lock Manager, MVCC, Two-Phase Locking, Savepoints).
5. **`NOT VERIFIED EXPERIMENTALLY`**: ChÆ°a Ä‘Æ°á»£c kiá»ƒm chá»©ng báº±ng thá»±c nghiá»‡m cháº¡y thá»±c táº¿ trĂªn mĂ´i trÆ°á»ng Ä‘á»™c láº­p.

Tuyá»‡t Ä‘á»‘i KHĂ”NG gĂ¡n nhĂ£n "Ä‘Ă£ xĂ¡c minh tá»« code" cho cĂ¡c thĂ nh pháº§n má»›i chá»‰ náº±m trong thiáº¿t káº¿ má»¥c tiĂªu hoáº·c pseudocode.

---

### TĂ“M Táº®T ÄIá»€U HĂ€NH: NHá»®NG ÄIá»‚M Sá»¬A Äá»”I & ÄĂNH CHĂNH QUAN TRá»ŒNG TRONG V2.7

```text
+-----------------------------------------------------------------------------------------------------------------------------------+
| Háº NG Má»¤C PHĂ‚N TĂCH | ÄIá»‚M CHÆ¯A CHáº¶T CHáº¼ TRONG V2.6                       | HOĂ€N THIá»†N & ÄĂNH CHĂNH TRONG V2.7 (CHUáº¨N XĂC)                 |
+-----------------------------------------------------------------------------------------------------------------------------------+
| B-49: Hiá»‡n tráº¡ng   | Gá»™p thao tĂ¡c ledger (chÆ°a cĂ³) vĂ o danh sĂ¡ch code    | TĂCH Báº CH 3 Cá»˜T TUYá»†T Äá»I: Báº£ng so_cap_so_phieu, cá»™t SoPhieu, |
| Code vs Thiáº¿t káº¿   | hiá»‡n táº¡i Ä‘Ă£ Ä‘Æ°á»£c xĂ¡c minh.                          | IdempotencyKey CHÆ¯A Tá»’N Táº I trong code vĂ  live DB!             |
+-----------------------------------------------------------------------------------------------------------------------------------+
| B-50: Transaction  | Tá»± viáº¿t helper DB::beginTransaction() thá»§ cĂ´ng      | PHĂT HIá»†N Rá»¦I RO: Nested transaction lá»“ng nhau (Savepoint),    |
| Laravel 12         | mĂ  chÆ°a xá»­ lĂ½ savepoint lá»“ng vĂ  lá»—i 1213/1205.      | 1213 tá»± rollback toĂ n bá»™, 1205 chá»‰ rollback Ä‘Æ¡n lá»‡nh.          |
|                    |                                                     | Chuáº©n hĂ³a pattern dĂ¹ng DB::transaction() + Exception.          |
+-----------------------------------------------------------------------------------------------------------------------------------+
| B-51: Kháº³ng Ä‘á»‹nh   | TuyĂªn bá»‘ "chá»©ng minh toĂ¡n há»c" loáº¡i trá»« 100%       | GIá»I Háº N PHáº M VI Káº¾T LUáº¬N: BĂ¡c bá» giáº£ Ä‘á»‹nh InnoDB cáº¥p lock     |
| Deadlock           | deadlock, giáº£ Ä‘á»‹nh InnoDB cáº¥p lock theo FIFO.       | theo FIFO. Chá»‰ káº¿t luáº­n: ChÆ°a tĂ¬m tháº¥y wait-for cycle trong    |
|                    |                                                     | 4 timeline Ä‘Æ°á»£c mĂ´ hĂ¬nh hĂ³a vá»›i cĂ¡c tĂ i nguyĂªn Ä‘Ă£ rĂ  soĂ¡t.     |
+-----------------------------------------------------------------------------------------------------------------------------------+
| B-52: Side Effects | Cho ráº±ng DB::afterCommit() lĂ  giáº£i phĂ¡p Ä‘á»§ an toĂ n  | LĂ€M RĂ• Rá»¦I RO: afterCommit chá»‰ lĂ  in-memory callback, náº¿u PHP   |
| & Atomicity        | cho thĂ´ng bĂ¡o ngoáº¡i vi.                             | crash sau commit thĂ¬ sá»± kiá»‡n Bá» Máº¤T. Báº¯t buá»™c Outbox cho SMS.  |
+-----------------------------------------------------------------------------------------------------------------------------------+
| B-53: State        | MĂ´ táº£ 6 transition nhÆ°ng chÆ°a lĂ m rĂµ race           | CHI TIáº¾T HĂ“A 6 TRANSITION: Äáº·c táº£ Ä‘iá»u kiá»‡n WHERE, chá»‘t cháº·n   |
| Machine Recovery   | condition khi worker vĂ  request cáº¡nh tranh.         | token, lease check vĂ  ranh giá»›i transaction tá»«ng bÆ°á»›c.         |
+-----------------------------------------------------------------------------------------------------------------------------------+
| B-54: Test Case    | 67 test case chÆ°a bao phá»§ commit failure vĂ  lá»—i     | Má» Rá»˜NG TEST MATRIX: Bá»• sung 6 test cases má»›i cho edge cases:  |
| Matrix Expansion   | nested transaction.                                 | Unknown commit, Nested guard, 1213 vs 1205, PHP crash outbox.  |
+-----------------------------------------------------------------------------------------------------------------------------------+
```

---

### PHáº¦N I. BLOCKER B-49: PHĂ‚N BIá»†T Ráº CH RĂ’I HIá»†N TRáº NG (CURRENT CODE) VĂ€ THIáº¾T Káº¾ (TARGET DESIGN)

Nháº±m loáº¡i bá» hoĂ n toĂ n sá»± nháº­p nháº±ng giá»¯a "nhá»¯ng gĂ¬ Ä‘ang cháº¡y trong repository" vĂ  "nhá»¯ng gĂ¬ Ä‘Æ°á»£c Ä‘á» xuáº¥t trong tĂ i liá»‡u thiáº¿t káº¿", báº£ng Ä‘á»‘i chiáº¿u dÆ°á»›i Ä‘Ă¢y phĂ¢n Ä‘á»‹nh ráº¡ch rĂ²i tá»«ng thao tĂ¡c:

```text
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| THAO TĂC NGHIá»†P Vá»¤    | HIá»†N TRáº NG MĂƒ NGUá»’N (CURRENT CODE)          | THIáº¾T Káº¾ Má»¤C TIĂU (TARGET DESIGN)            | Báº°NG CHá»¨NG SOURCE / SCHEMA         | TRáº NG THĂI HIá»†N Táº I          |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 1. Cáº¥p sá»‘ & Claim     | CHÆ¯A CĂ“. KhĂ´ng cĂ³ báº£ng so_cap_so_phieu,     | TĂ¡ch thĂ nh Autonomous Claim Tx1: Cáº­p nháº­t    | app/Models/: KhĂ´ng cĂ³ file         | TARGET DESIGN SPECIFIED      |
|    Ledger             | khĂ´ng cĂ³ logic claim trong Controller.      | ledger sang DANG_XU_LY vĂ  Ä‘á»c FenceToken.    | SoCapSoPhieu.php. Live DB chÆ°a cĂ³. | (CHÆ¯A THá»‚ CHáº Y TRĂN LIVE DB) |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 2. Lock Lá»‹ch háº¹n      | ÄĂƒ CĂ“: lockForUpdate() trĂªn Clustered       | Giá»¯ nguyĂªn: KhĂ³a Exclusive Record Lock       | LuotKhamController.php L250        | CURRENT CODE VERIFIED        |
|    gá»‘c                | Index PK cá»§a báº£ng lich_hen.                 | trĂªn dĂ²ng lich_hen Ä‘á»ƒ chá»‘ng tiáº¿p nháº­n kĂ©p.   |                                    | (Äang hoáº¡t Ä‘á»™ng trong code)  |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 3. Lock Check         | ÄĂƒ CĂ“: lockForUpdate() trĂªn luot_kham       | Giá»¯ nguyĂªn: Kiá»ƒm tra khĂ´ng táº¡o trĂ¹ng lÆ°á»£t    | LuotKhamController.php L258        | CURRENT CODE VERIFIED        |
|    LÆ°á»£t khĂ¡m          | theo MaLichHen.                             | khĂ¡m cho cĂ¹ng má»™t lá»‹ch háº¹n.                  |                                    | (Äang hoáº¡t Ä‘á»™ng trong code)  |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 4. UPDATE Lá»‹ch háº¹n    | ÄĂƒ CĂ“: Cáº­p nháº­t TrangThai = 'DA_TIEP_NHAN'  | Giá»¯ nguyĂªn: Chuyá»ƒn tráº¡ng thĂ¡i lá»‹ch háº¹n       | LuotKhamController.php L281-283    | CURRENT CODE VERIFIED        |
|    sang ÄĂ£ tiáº¿p nháº­n  | trong transaction tiáº¿p nháº­n.                | Ä‘á»“ng bá»™ trong Business Tx2.                  |                                    | (Äang hoáº¡t Ä‘á»™ng trong code)  |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 5. INSERT LÆ°á»£t khĂ¡m   | ÄĂƒ CĂ“: ChĂ¨n MaLichHen, MaBenhNhan, MaBacSi, | Bá»• sung 4 cá»™t má»›i: MaPhamVi, STTTrongNgay,   | LuotKhamController.php L291-298.   | CURRENT CODE VERIFIED        |
|    (luot_kham)        | ThoiGianTiepNhan, TrangThai = 'CHO_KHAM'.   | SoPhieu, MaChuyenKhoa (RĂ ng buá»™c Unique).    | Live DB: 4 cá»™t má»›i CHÆ¯A Tá»’N Táº I!   | (Cá»™t má»›i lĂ  TARGET DESIGN)   |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 6. Finalize Ledger    | CHÆ¯A CĂ“: KhĂ´ng cĂ³ cĂ¢u lá»‡nh cáº­p nháº­t         | Bá»• sung vĂ o cuá»‘i Tx2: Cáº­p nháº­t ledger sang   | ChÆ°a cĂ³ trong Controller hiá»‡n táº¡i. | TARGET DESIGN SPECIFIED      |
|    sang DA_SU_DUNG    | sá»• cáº¥p sá»‘ nĂ o trong mĂ£ nguá»“n hiá»‡n táº¡i.      | DA_SU_DUNG kĂ¨m chá»‘t cháº·n FenceToken.         | Live DB: Báº£ng ledger CHÆ¯A Tá»’N Táº I! | (CHÆ¯A THá»‚ CHáº Y TRĂN LIVE DB) |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 7. Ghi thĂ´ng bĂ¡o ná»™i  | ÄĂƒ CĂ“: NotificationService::sendToDoctor     | Giá»¯ nguyĂªn: Ghi báº£ng thong_bao ná»™i bá»™,       | LuotKhamController.php L307, L316; | CURRENT CODE VERIFIED        |
|    bá»™ vĂ o Database    | vĂ  sendToPatient (INSERT vĂ o thong_bao).    | tá»± Ä‘á»™ng rollback khi Tx2 bá»‹ hoĂ n tĂ¡c.        | NotificationService.php L20        | (Náº±m trong cĂ¹ng transaction) |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 8. Broadcast thá»i     | CHÆ¯A CĂ“: ChÆ°a gá»i event(new ...) hoáº·c       | Äá» xuáº¥t Giai Ä‘oáº¡n 3: Bá»c trong               | NotificationService.php: KhĂ´ng cĂ³  | TARGET DESIGN SPECIFIED      |
|    gian thá»±c WebSockets| broadcast kĂªnh Reverb/Pusher nĂ o.           | DB::afterCommit Ä‘á»ƒ phĂ¡t sá»± kiá»‡n ra ngoĂ i.    | lá»‡nh broadcast/event nĂ o.          | (CHÆ¯A CĂ“ TRONG CODEBASE)     |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 9. SMS / Zalo Gateway | CHÆ¯A CĂ“: ChÆ°a tĂ­ch há»£p báº¥t ká»³ cá»•ng API ngoĂ i| Äá» xuáº¥t Giai Ä‘oáº¡n 3: Triá»ƒn khai báº£ng         | KhĂ´ng cĂ³ báº£ng outbox_messages,     | TARGET DESIGN SPECIFIED      |
|    / Outbox Worker    | nĂ o trong mĂ£ nguá»“n hiá»‡n táº¡i.                | outbox_messages vĂ  worker gá»­i tin cĂ³ retry.  | khĂ´ng cĂ³ Http client SMS nĂ o.      | (CHÆ¯A CĂ“ TRONG CODEBASE)     |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

> [!WARNING] Káº¾T LUáº¬N MINH Báº CH:
> - Thao tĂ¡c `so_cap_so_phieu` (cáº£ Claim Tx1 láº«n Finalize Tx2) **HOĂ€N TOĂ€N LĂ€ THIáº¾T Káº¾ Má»¤C TIĂU (TARGET DESIGN)**, chÆ°a cĂ³ má»™t dĂ²ng code thá»±c thi nĂ o trong codebase hiá»‡n táº¡i.
> - Báº£ng `so_cap_so_phieu` vĂ  cĂ¡c cá»™t `SoPhieu`, `MaPhamVi`, `STTTrongNgay`, `MaChuyenKhoa` **CHÆ¯A Tá»’N Táº I TRĂN LIVE DATABASE** (`LIVE SCHEMA VERIFIED`).
> - Do Ä‘Ă³, má»i phĂ¢n tĂ­ch vá» sá»± tÆ°Æ¡ng tĂ¡c giá»¯a Request vĂ  Ledger lĂ  **PHĂ‚N TĂCH THIáº¾T Káº¾ TRÆ¯á»C TRIá»‚N KHAI (PRE-IMPLEMENTATION DESIGN ANALYSIS)**, khĂ´ng thá»ƒ tuyĂªn bá»‘ lĂ  hĂ nh vi Ä‘Ă£ kiá»ƒm chá»©ng trĂªn há»‡ thá»‘ng live.

---

### PHáº¦N II. BLOCKER B-50: KIá»‚M Äá»NH EXPLICIT TRANSACTION TRONG LARAVEL 12

#### 1. PhĂ¢n TĂ­ch 8 TĂ¬nh Huá»‘ng Ká»¹ Thuáº­t ChuyĂªn SĂ¢u Cá»§a Giao Dá»‹ch

Kháº£o sĂ¡t trá»±c tiáº¿p tá»« `vendor/laravel/framework/src/Illuminate/Database/Concerns/ManagesTransactions.php`:

##### TĂ¬nh huá»‘ng 1: `beginTransaction()` tháº¥t báº¡i
- **NguyĂªn nhĂ¢n:** Máº¥t káº¿t ná»‘i máº¡ng tá»›i MySQL server ngay trÆ°á»›c khi gá»­i lá»‡nh `BEGIN`, mĂ¡y chá»§ MySQL cháº¡m `max_connections`, hoáº·c server Ä‘ang khá»Ÿi Ä‘á»™ng láº¡i.
- **HĂ nh vi Laravel:** NĂ©m `PDOException`. Thuá»™c tĂ­nh `$this->transactions` khĂ´ng tÄƒng (váº«n giá»¯ nguyĂªn giĂ¡ trá»‹ 0).
- **Rá»§i ro náº¿u viáº¿t try/catch sai:** Náº¿u Ä‘áº·t `DB::beginTransaction()` bĂªn trong khá»‘i `try` vĂ  trong khá»‘i `catch` gá»i mĂ¹ quĂ¡ng `DB::rollBack()`:
  - HĂ m `rollBack()` cá»§a Laravel kiá»ƒm tra: `if ($toLevel < 0 || $toLevel >= $this->transactions) { return; }`. Náº¿u `$this->transactions == 0`, Laravel bá» qua an toĂ n.
  - NhÆ°ng náº¿u gá»i trá»±c tiáº¿p `$pdo->rollBack()`, PDO sáº½ nĂ©m tiáº¿p má»™t ngoáº¡i lá»‡ nghiĂªm trá»ng: `PDOException: There is no active transaction`.
- **Quy táº¯c chuáº©n:** Pháº£i Ä‘áº·t `DB::beginTransaction()` bĂªn trong `try/catch` cĂ³ kiá»ƒm tra cáº¥p Ä‘á»™ transaction trÆ°á»›c khi rollback, hoáº·c sá»­ dá»¥ng `DB::transaction()` cá»§a Laravel.

##### TĂ¬nh huá»‘ng 2: Query phĂ¡t sinh MySQL Error 1213 (Deadlock found)
- **CÆ¡ cháº¿ MySQL InnoDB:** Khi phĂ¡t hiá»‡n chu trĂ¬nh Deadlock trong Wait-For Graph, InnoDB Lock Manager tá»± Ä‘á»™ng chá»n tiáº¿n trĂ¬nh cĂ³ chi phĂ­ rollback nhá» nháº¥t lĂ m náº¡n nhĂ¢n (victim) vĂ  **Tá»° Äá»˜NG THá»°C HIá»†N ROLLBACK TOĂ€N Bá»˜ TRANSACTION Cá»¦A TIáº¾N TRĂŒNH ÄĂ“ á» Táº¦NG DATABASE ENGINE**!
- **HĂ nh vi Laravel:**
  - Táº¡i táº§ng á»©ng dá»¥ng, PDO nĂ©m ngoáº¡i lá»‡ `PDOException: SQLSTATE[40001]: Serialization failure: 1213 Deadlock found`.
  - Náº¿u Ä‘ang á»Ÿ transaction lá»“ng nhau (`$this->transactions > 1`), toĂ n bá»™ cĂ¡c savepoints Ä‘Ă£ bá»‹ MySQL xĂ³a sáº¡ch. Laravel phĂ¡t hiá»‡n `causedByConcurrencyError($e)` vĂ  nĂ©m ngay `DeadlockException` ra ngoĂ i cĂ¹ng thay vĂ¬ cá»‘ gáº¯ng rollback savepoint vĂ´ nghÄ©a.
  - Náº¿u Ä‘ang á»Ÿ transaction cáº¥p 1 (`$this->transactions == 1`), Laravel gá»i `$this->rollBack()`. á» táº§ng PDO, lá»‡nh rollback nĂ y Ä‘á»“ng bá»™ láº¡i tráº¡ng thĂ¡i autocommit cá»§a káº¿t ná»‘i.

##### TĂ¬nh huá»‘ng 3: Query phĂ¡t sinh MySQL Error 1205 (Lock wait timeout exceeded)
- **Sá»° KHĂC BIá»†T Cá»T Tá»¬ SO Vá»I Lá»–I 1213:**
  - Trong MySQL InnoDB, biáº¿n há»‡ thá»‘ng `innodb_rollback_on_timeout` máº·c Ä‘á»‹nh lĂ  **`OFF`**!
  - Äiá»u nĂ y cĂ³ nghÄ©a lĂ  khi xáº£y ra Lock Wait Timeout (Error 1205), **INNODB CHá»ˆ ROLLBACK CĂ‚U Lá»†NH Vá»ªA Bá» TIMEOUT, HOĂ€N TOĂ€N KHĂ”NG ROLLBACK TOĂ€N Bá»˜ TRANSACTION**!
  - CĂ¡c cĂ¢u lá»‡nh ghi dá»¯ liá»‡u Ä‘Ă£ thá»±c thi thĂ nh cĂ´ng trÆ°á»›c Ä‘Ă³ trong cĂ¹ng transaction **VáºªN Náº°M NGUYĂN TRONG TRáº NG THĂI ACTIVE VĂ€ CHÆ¯A ÄÆ¯á»¢C GIáº¢I PHĂ“NG KHĂ“A**!
- **Háº­u quáº£ náº¿u xá»­ lĂ½ sai:** Náº¿u á»©ng dá»¥ng báº¯t lá»—i 1205 mĂ  khĂ´ng gá»i `rollBack()` toĂ n bá»™, transaction sáº½ bá»‹ treo lÆ¡ lá»­ng, tiáº¿p tá»¥c chiáº¿m giá»¯ row locks vĂ  gĂ¢y ngháº½n toĂ n bá»™ há»‡ thá»‘ng!
- **Quy táº¯c báº¯t buá»™c:** Khi gáº·p lá»—i 1205, **Báº®T BUá»˜C PHáº¢I Gá»ŒI `DB::rollBack()` TÆ¯á»œNG MINH** Ä‘á»ƒ há»§y bá» toĂ n bá»™ transaction.

##### TĂ¬nh huá»‘ng 4: Lá»—i xáº£y ra khi gá»i `commit()` (Commit Failure / Unknown Commit Result)
- **Báº£n cháº¥t phĂ¢n tĂ¡n:** Khi client gá»­i lá»‡nh `COMMIT`:
  - TrÆ°á»ng há»£p 4a: MySQL tá»« chá»‘i commit (do lá»—i disk, deferred constraint fails) $\rightarrow$ Database tá»± rollback $\rightarrow$ Káº¿t quáº£ xĂ¡c Ä‘á»‹nh lĂ  THáº¤T Báº I.
  - TrÆ°á»ng há»£p 4b: MySQL Ä‘Ă£ ghi Redo Log, ghi Binlog vĂ  commit thĂ nh cĂ´ng trĂªn Ä‘Ä©a cá»©ng, nhÆ°ng Ä‘Ăºng lĂºc gá»­i gĂ³i tin TCP OK vá» cho PHP thĂ¬ Ä‘á»©t cĂ¡p máº¡ng hoáº·c PHP process bá»‹ timeout!
  - $\rightarrow$ **Káº¾T QUáº¢ KHĂ”NG XĂC Äá»NH (UNKNOWN COMMIT RESULT):** PhĂ­a client nháº­n ngoáº¡i lá»‡ káº¿t ná»‘i, nhÆ°ng phĂ­a database dá»¯ liá»‡u ÄĂƒ ÄÆ¯á»¢C COMMIT CHĂNH THá»¨C!
- **Chiáº¿n lÆ°á»£c xá»­ lĂ½ báº±ng Idempotency Key:**
  - VĂ¬ báº£ng ledger cĂ³ rĂ ng buá»™c `UNIQUE(IdempotencyKey)`, náº¿u láº§n commit trÆ°á»›c Ä‘Ă£ thĂ nh cĂ´ng trĂªn DB, láº§n retry tiáº¿p theo vá»›i cĂ¹ng `IdempotencyKey` sáº½ nháº­n `affected_rows = 0` (náº¿u kiá»ƒm tra DA_CAP).
  - Client chá»‰ cáº§n truy váº¥n láº¡i theo `IdempotencyKey` Ä‘á»ƒ biáº¿t chĂ­nh xĂ¡c vĂ© Ä‘Ă£ Ä‘Æ°á»£c claim thĂ nh cĂ´ng hay chÆ°a, loáº¡i trá»« hoĂ n toĂ n rá»§i ro xá»­ lĂ½ trĂ¹ng láº·p!

##### TĂ¬nh huá»‘ng 5: Transaction lá»“ng nhau (Nested Transactions / Savepoints)
- Khi gá»i `DB::beginTransaction()` láº§n 2 trong lĂºc caller Ä‘Ă£ má»Ÿ transaction:
  - Laravel tÄƒng `$this->transactions` lĂªn 2 vĂ  gá»­i lá»‡nh: `SAVEPOINT trans2`.
  - Náº¿u hĂ m con gá»i `DB::rollBack()`, Laravel gá»­i lá»‡nh: `ROLLBACK TO SAVEPOINT trans2`.
  - **Cáº¡m báº«y:** NĂ³ **KHĂ”NG Há»€ ROLLBACK TRANSACTION Cá»¦A CALLER**, vĂ  cĂ¡c khĂ³a mĂ  hĂ m con Ä‘Ă£ xin **KHĂ”NG ÄÆ¯á»¢C GIáº¢I PHĂ“NG HOĂ€N TOĂ€N** cho tá»›i khi transaction ngoĂ i cĂ¹ng commit!
- **Quy táº¯c an toĂ n báº¥t biáº¿n:** HĂ m Claim Tx1 Ä‘Æ°á»£c thiáº¿t káº¿ lĂ  **Autonomous Transaction** (Transaction tá»± trá»‹). NĂ³ **TUYá»†T Äá»I KHĂ”NG ÄÆ¯á»¢C PHĂ‰P CHáº Y Lá»’NG BĂN TRONG Báº¤T Ká»² TRANSACTION NĂ€O KHĂC**!

##### TĂ¬nh huá»‘ng 6: Laravel transaction level khĂ¡c vá»›i tráº¡ng thĂ¡i PDO
- Náº¿u káº¿t ná»‘i PDO bá»‹ reset ngáº§m hoáº·c driver nĂ©m lá»—i ngáº¯t káº¿t ná»‘i, biáº¿n Ä‘áº¿m `$this->transactions` trong Laravel cĂ³ thá»ƒ mang giĂ¡ trá»‹ 1 trong khi `$pdo->inTransaction()` tráº£ vá» `false`.
- Gá»i rollback trĂªn connection bá»‹ lá»‡ch pha sáº½ nĂ©m ngoáº¡i lá»‡ thá»© cáº¥p, che láº¥p nguyĂªn nhĂ¢n gá»‘c rá»… cá»§a lá»—i ban Ä‘áº§u.

##### TĂ¬nh huá»‘ng 7: Rollback Ä‘Æ°á»£c gá»i khi MySQL Ä‘Ă£ tá»± rollback
- ÄÆ°á»£c xá»­ lĂ½ an toĂ n náº¿u bá»c trong khá»‘i `try/catch` khi dá»n dáº¹p káº¿t ná»‘i, ghi log cáº£nh bĂ¡o vĂ  khĂ´ng re-throw lá»—i rollback phá»¥.

##### TĂ¬nh huá»‘ng 8: Retry táº¡o transaction má»›i sau Deadlock/Timeout
- Khi retry á»Ÿ vĂ²ng láº·p tiáº¿p theo, báº¯t buá»™c transaction trÆ°á»›c Ä‘Ă³ pháº£i Ä‘Æ°á»£c dá»n dáº¹p hoĂ n toĂ n (má»©c transaction level quay vá» Ä‘Ăºng 0) trÆ°á»›c khi má»Ÿ `beginTransaction()` má»›i.

---

#### 2. Pattern Giao Dá»‹ch Chuáº©n HĂ³a An ToĂ n Tuyá»‡t Äá»‘i Cho Claim Transaction

Dá»±a trĂªn viá»‡c kiá»ƒm Ä‘á»‹nh sĂ¢u mĂ£ nguá»“n Laravel 12, giáº£i phĂ¡p an toĂ n nháº¥t lĂ  káº¿t há»£p:
1. **Chá»‘t cháº·n Autonomous Guard:** Kiá»ƒm tra `DB::transactionLevel() === 0`.
2. **Sá»­ dá»¥ng cÆ¡ cháº¿ `DB::transaction(Closure, attempts)` gá»‘c cá»§a Laravel** Ä‘á»ƒ táº­n dá»¥ng toĂ n bá»™ logic xá»­ lĂ½ deadlock retry, savepoint unwinding Ä‘Ă£ Ä‘Æ°á»£c kiá»ƒm chá»©ng cá»§a framework.
3. **KĂ­ch hoáº¡t Rollback thá»±c sá»± báº±ng Exception ná»™i bá»™:** NĂ©m má»™t `ClaimConflictException` Ä‘á»ƒ Ă©p buá»™c Laravel gá»i `$this->rollBack()` sáº¡ch sáº½ thay vĂ¬ "Empty Commit", sau Ä‘Ă³ báº¯t láº¡i exception nĂ y á»Ÿ táº§ng ngoĂ i cĂ¹ng vĂ  tráº£ vá» `null`.

```php
namespace App\Exceptions;
use RuntimeException;

// Exception ná»™i bá»™ dĂ¹ng Ä‘á»ƒ Ä‘iá»u khiá»ƒn luá»“ng rollback sáº¡ch sáº½ trong Laravel
class ClaimConflictException extends RuntimeException {}

/**
 * THIáº¾T Káº¾ Má»¤C TIĂU: HĂ€M CLAIM Tá»° TRá» AN TOĂ€N TUYá»†T Äá»I (V2.7)
 * Äáº£m báº£o: KhĂ´ng lá»“ng transaction, rollback thá»±c sá»± khi affected != 1, 
 * retry deadlock tá»± Ä‘á»™ng, khĂ´ng Ä‘á»c LAST_INSERT_ID rĂ¡c.
 */
function claimTicketLedgerSafe(string $idempotencyKey, string $processId, int $maxAttempts = 3): ?int 
{
    // 1. Chá»‘t cháº·n Autonomous Guard: Cáº¥m tuyá»‡t Ä‘á»‘i cháº¡y lá»“ng trong transaction cá»§a caller
    if (DB::transactionLevel() > 0) {
        throw new \LogicException(
            "FATAL ARCHITECTURAL VIOLATION: Claim Ticket Ledger must execute as an autonomous transaction. " .
            "Current transaction level is " . DB::transactionLevel() . ". Do not wrap claimTicketLedger in an outer transaction."
        );
    }

    try {
        // 2. Sá»­ dá»¥ng DB::transaction vá»›i sá»‘ láº§n attempts Ä‘á»ƒ Laravel tá»± Ä‘á»™ng xá»­ lĂ½ Deadlock 1213
        return DB::transaction(function () use ($idempotencyKey, $processId) {
            // 2.1. Atomic Conditional UPDATE há»£p nháº¥t
            $affected = DB::update("
                UPDATE so_cap_so_phieu 
                SET TrangThai = 'DANG_XU_LY',
                    LockedByProcess = :processId,
                    LeaseExpiresAt = DATE_ADD(NOW(), INTERVAL 60 SECOND),
                    FenceToken = LAST_INSERT_ID(FenceToken + 1)
                WHERE IdempotencyKey = :idempotencyKey 
                  AND (
                      TrangThai = 'DA_CAP' 
                      OR (TrangThai = 'DANG_XU_LY' AND LeaseExpiresAt < NOW())
                  )
            ", [
                'processId' => $processId,
                'idempotencyKey' => $idempotencyKey,
            ]);

            // 2.2. Náº¿u khĂ´ng cáº­p nháº­t Ä‘Æ°á»£c dĂ²ng nĂ o -> Báº®T BUá»˜C NĂ‰M EXCEPTION Äá»‚ LARAVEL ROLLBACK
            if ($affected !== 1) {
                // Laravel sáº½ báº¯t exception nĂ y, gá»i $this->rollBack() vĂ  hoĂ n tráº£ sáº¡ch sáº½ tráº¡ng thĂ¡i káº¿t ná»‘i
                throw new ClaimConflictException("Ticket cannot be claimed: either already claimed or in valid lease.");
            }

            // 2.3. Äá»c FenceToken trĂªn cĂ¹ng káº¿t ná»‘i Master khi Ä‘ang giá»¯ Exclusive Row Lock
            $tokenRow = DB::selectOne("SELECT LAST_INSERT_ID() AS assignedToken");
            $assignedToken = (int) ($tokenRow->assignedToken ?? 0);

            if ($assignedToken <= 0) {
                throw new \RuntimeException("CRITICAL: Failed to retrieve valid FenceToken after atomic claim update.");
            }

            // 2.4. Commit thĂ nh cĂ´ng, giáº£i phĂ³ng X-lock, tráº£ vá» token há»£p lá»‡
            return $assignedToken;
        }, $maxAttempts);

    } catch (ClaimConflictException $e) {
        // Báº¯t ngoáº¡i lá»‡ ná»™i bá»™: XĂ¡c nháº­n transaction Ä‘Ă£ Ä‘Æ°á»£c rollback 100%, tráº£ vá» null an toĂ n
        return null;
    } catch (\Throwable $e) {
        // CĂ¡c lá»—i nghiĂªm trá»ng khĂ¡c hoáº·c vÆ°á»£t quĂ¡ sá»‘ láº§n retry deadlock
        Log::error("claimTicketLedgerSafe unrecoverable error: " . $e->getMessage(), [
            'idempotencyKey' => $idempotencyKey,
            'exception' => $e
        ]);
        throw $e;
    }
}
```

---

### PHáº¦N III. BLOCKER B-51: RĂ€ SOĂT DEADLOCK VĂ€ GIá»I Háº N KHáº²NG Äá»NH TRĂN WAIT-FOR GRAPH

#### 1. ÄĂ­nh ChĂ­nh CĂ¡c Nháº­n Äá»‹nh LĂ½ Thuyáº¿t ChÆ°a Cháº·t Cháº½ Trong V2.6
1. **BĂ¡c bá» giáº£ Ä‘á»‹nh InnoDB cáº¥p khĂ³a theo FIFO:**
   - Trong MySQL 8.0 InnoDB Engine, hĂ ng Ä‘á»£i cáº¥p khĂ³a **KHĂ”NG PHáº¢I LĂ€ FIFO HOĂ€N TOĂ€N**.
   - Lock Manager cĂ³ thá»ƒ sáº¯p xáº¿p láº¡i thá»© tá»± Æ°u tiĂªn (Lock Priority), káº¿ thá»«a khĂ³a khi báº£n ghi bá»‹ xĂ³a/tĂ¡ch trang B-Tree (Lock Inheritance), hoáº·c Æ°u tiĂªn cĂ¡c transaction cĂ³ trá»ng sá»‘ lá»›n hÆ¡n Ä‘á»ƒ giáº£m chi phĂ­ rollback khi xá»­ lĂ½ deadlock. Do Ä‘Ă³, khĂ´ng thá»ƒ dĂ¹ng giáº£ Ä‘á»‹nh FIFO Ä‘á»ƒ suy diá»…n káº¿t quáº£ cá»§a cĂ¡c tĂ¬nh huá»‘ng tranh cháº¥p microsecond.
2. **Giá»›i háº¡n pháº¡m vi káº¿t luáº­n khĂ´ng Deadlock:**
   - Má»™t transaction nghiá»‡p vá»¥ thá»±c táº¿ khĂ´ng chá»‰ cháº¡m vĂ o 2 báº£ng `luot_kham` vĂ  `so_cap_so_phieu`.
   - NĂ³ cĂ²n cháº¡m vĂ o: `lich_hen` (Record X-lock), `benh_nhan` (Shared lock do foreign key check), `bac_si` (Shared lock do foreign key check), `thong_bao` (Insert Intention Lock), vĂ  cĂ¡c secondary indexes liĂªn quan.
   - **TuyĂªn bá»‘ chuáº©n xĂ¡c:** "Trong pháº¡m vi táº­p tĂ i nguyĂªn Ä‘Ă£ phĂ¢n tĂ­ch (bao gá»“m `luot_kham` vĂ  `so_cap_so_phieu`), chÆ°a tĂ¬m tháº¥y chu trĂ¬nh chá» chĂ©o (Wait-For Graph Cycle) trong 4 timeline mĂ´ phá»ng. ToĂ n bá»™ há»‡ thá»‘ng cĂ³ deadlock hay khĂ´ng pháº£i Ä‘Æ°á»£c kiá»ƒm chá»©ng báº±ng thá»±c nghiá»‡m Ä‘a luá»“ng trĂªn Database Clone."

---

#### 2. PhĂ¢n TĂ­ch Chi Tiáº¿t 4 Timeline Vá»›i CĂ¡c Loáº¡i KhĂ³a Cá»¥ Thá»ƒ Cá»§a InnoDB

##### KĂ½ hiá»‡u loáº¡i khĂ³a InnoDB:
- **`Record X-Lock`**: KhĂ³a Ä‘á»™c quyá»n trĂªn báº£n ghi váº­t lĂ½ cá»§a Clustered Index (Primary Key).
- **`Gap S-Lock`**: KhĂ³a chia sáº» trĂªn khoáº£ng trá»‘ng (gap) giá»¯a 2 báº£n ghi trĂªn B-Tree leaf node Ä‘á»ƒ chá»‘ng Phantom Row.
- **`Insert Intention X-Lock`**: KhĂ³a xin chĂ¨n báº£n ghi má»›i vĂ o má»™t khoáº£ng trá»‘ng (bá»‹ cháº·n bá»Ÿi báº¥t ká»³ Gap Lock nĂ o).

---

##### TIMELINE A: A ChÆ°a INSERT LÆ°á»£t KhĂ¡m, Lease Háº¿t Háº¡n, Worker Cháº¡y TrÆ°á»›c, B Reclaim
- **Táº­p tĂ i nguyĂªn:** `so_cap_so_phieu` (PK `MaCapSo`), `luot_kham` (Unique Index `uq_luot_kham_so_phieu`).
- **Diá»…n biáº¿n khĂ³a:**
  1. Worker cháº¡y `SELECT ... FOR SHARE` trĂªn `SoPhieu = 'DL-001'` (chÆ°a cĂ³ trong `luot_kham`):
     - InnoDB Ä‘áº·t **`Gap S-Lock`** trĂªn khoáº£ng trá»‘ng index cá»§a `luot_kham`.
  2. Request B cháº¡y Claim Tx1 trĂªn `so_cap_so_phieu`:
     - B nháº­n **`Record X-Lock`** trĂªn dĂ²ng ledger, nĂ¢ng `FenceToken = 2` vĂ  commit Tx1 ngay $\rightarrow$ Giáº£i phĂ³ng X-lock.
  3. Worker cháº¡y conditional UPDATE trĂªn `so_cap_so_phieu` vá»›i `FenceToken = 1`:
     - VĂ¬ token trong DB Ä‘Ă£ lĂ  2, cĂ¢u lá»‡nh nháº­n `affected_rows = 0`.
     - Worker commit/rollback transaction Ä‘á»‘i soĂ¡t $\rightarrow$ **Giáº£i phĂ³ng `Gap S-Lock` trĂªn `luot_kham`**.
  4. Tiáº¿n trĂ¬nh A thá»©c dáº­y, cháº¡y `INSERT INTO luot_kham`:
     - VĂ¬ Worker Ä‘Ă£ giáº£i phĂ³ng Gap S-Lock, A xin thĂ nh cĂ´ng **`Insert Intention X-Lock`** $\rightarrow$ chĂ¨n dĂ²ng má»›i.
  5. A cháº¡y bÆ°á»›c chá»‘t cuá»‘i Tx2 trĂªn `so_cap_so_phieu` vá»›i `FenceToken = 1`:
     - Nháº­n `affected_rows = 0` vĂ¬ token Ä‘Ă£ lĂ  2 $\rightarrow$ A gá»i `DB::rollBack()` $\rightarrow$ XĂ³a sáº¡ch dĂ²ng `luot_kham` vá»«a chĂ¨n.
- **Wait-For Graph:**
  $$\text{KhĂ´ng cĂ³ cáº¡nh chá» nĂ o tá»“n táº¡i Ä‘á»“ng thá»i giá»¯a A, B vĂ  Worker} \implies \text{KHĂ”NG CĂ“ CHU TRĂŒNH DEADLOCK}.$$

---

##### TIMELINE B: A ÄĂ£ INSERT LÆ°á»£t KhĂ¡m NhÆ°ng ChÆ°a Commit, Worker Cháº¡y `FOR SHARE`, B Reclaim
- **Diá»…n biáº¿n khĂ³a:**
  1. A cháº¡y `INSERT INTO luot_kham` trong Tx2:
     - A Ä‘ang giá»¯ **`Record X-Lock`** trĂªn báº£n ghi má»›i chĂ¨n trong `luot_kham`.
  2. Worker cháº¡y `SELECT ... FOR SHARE` trĂªn cĂ¹ng `SoPhieu`:
     - VĂ¬ A Ä‘ang giá»¯ `Record X-Lock`, **Worker bá»‹ cháº·n (LOCK WAIT)** xin `Record S-Lock` chá» A commit/rollback!
     - Cáº¡nh chá»: $\text{Worker} \xrightarrow{\text{chá» S-Lock}} \text{A}$.
  3. B cháº¡y Reclaim trĂªn `so_cap_so_phieu`:
     - B nĂ¢ng `FenceToken = 2` thĂ nh cĂ´ng vĂ  commit Tx1 cá»§a B (khĂ´ng liĂªn quan Ä‘áº¿n `luot_kham`).
  4. A thá»©c dáº­y, cháº¡y bÆ°á»›c chá»‘t cuá»‘i Tx2 trĂªn `so_cap_so_phieu` vá»›i `FenceToken = 1`:
     - Nháº­n `affected_rows = 0` $\rightarrow$ A gá»i `DB::rollBack()`.
     - Lá»‡nh rollback cá»§a A **giáº£i phĂ³ng `Record X-Lock` trĂªn `luot_kham`** vĂ  xĂ³a báº£n ghi.
  5. Worker háº¿t bá»‹ block, Ä‘á»c Ä‘Æ°á»£c káº¿t quáº£ sau rollback (báº£n ghi khĂ´ng tá»“n táº¡i).
- **Wait-For Graph:**
  $$\text{Worker} \longrightarrow \text{A} \quad (\text{Chá»‰ cĂ³ 1 cáº¡nh chá» Ä‘Æ¡n hÆ°á»›ng, A khĂ´ng há» chá» Worker}) \implies \text{KHĂ”NG CĂ“ DEADLOCK}.$$

---

##### TIMELINE C: Worker Giá»¯ Gap Lock TrÆ°á»›c, Request INSERT LÆ°á»£t KhĂ¡m
- **Diá»…n biáº¿n khĂ³a:**
  1. Worker cháº¡y `SELECT ... FOR SHARE` trĂªn `SoPhieu` chÆ°a tá»“n táº¡i trong `luot_kham`:
     - InnoDB cáº¥p **`Gap S-Lock`** cho Worker trĂªn khoáº£ng trá»‘ng index `luot_kham`.
  2. Request cháº¡y `INSERT INTO luot_kham`:
     - Request xin **`Insert Intention X-Lock`** trĂªn cĂ¹ng khoáº£ng trá»‘ng index.
     - Ma tráº­n tÆ°Æ¡ng thĂ­ch khĂ³a InnoDB: `Gap S-Lock` xung Ä‘á»™t vá»›i `Insert Intention X-Lock`!
     - $\rightarrow$ **Request bá»‹ cháº·n (LOCK WAIT)** chá» Worker giáº£i phĂ³ng Gap Lock!
     - Cáº¡nh chá»: $\text{Request} \xrightarrow{\text{chá» Insert Intention}} \text{Worker}$.
  3. Worker cháº¡y cĂ¢u lá»‡nh tiáº¿p theo: UPDATE `so_cap_so_phieu` sang `DA_HUY`:
     - Worker xin **`Record X-Lock`** trĂªn dĂ²ng ledger trong `so_cap_so_phieu`.
     - **Kiá»ƒm tra tráº¡ng thĂ¡i cá»§a Request:** Request Ä‘ang bá»‹ block á»Ÿ bÆ°á»›c INSERT `luot_kham` (BÆ°á»›c 5), **Request CHÆ¯A Há»€ CHáº Y Äáº¾N BÆ¯á»C 6 Ä‘á»ƒ khĂ³a `so_cap_so_phieu`**!
     - Do Ä‘Ă³, dĂ²ng ledger Ä‘ang hoĂ n toĂ n tá»± do! Worker **Ä‘Æ°á»£c cáº¥p ngay `Record X-Lock` trĂªn `so_cap_so_phieu`** mĂ  khĂ´ng pháº£i chá» Request!
  4. Worker cáº­p nháº­t `DA_HUY` thĂ nh cĂ´ng vĂ  `COMMIT` transaction:
     - Lá»‡nh commit cá»§a Worker **giáº£i phĂ³ng `Gap S-Lock` trĂªn `luot_kham`**!
  5. Request háº¿t bá»‹ block, chĂ¨n thĂ nh cĂ´ng báº£n ghi vĂ o `luot_kham`.
  6. Request chuyá»ƒn sang bÆ°á»›c 6 cáº­p nháº­t `so_cap_so_phieu` $\rightarrow$ Nháº­n `affected_rows = 0` vĂ¬ tráº¡ng thĂ¡i Ä‘Ă£ thĂ nh `DA_HUY` $\rightarrow$ Request rollback toĂ n bá»™ Tx2!
- **Wait-For Graph:**
  $$\text{Request} \longrightarrow \text{Worker} \quad (\text{Worker khĂ´ng chá» Request}) \implies \text{KHĂ”NG CĂ“ CHU TRĂŒNH DEADLOCK}.$$

---

##### TIMELINE D: A Äang XĂ¡c Nháº­n FenceToken Cuá»‘i Tx2, Worker VĂ  B CĂ¹ng Tranh Cháº¥p Ledger
- **Diá»…n biáº¿n khĂ³a táº¡i báº£ng `so_cap_so_phieu`:**
  - Cáº£ 3 tiáº¿n trĂ¬nh (A finalize, B reclaim, Worker void) cĂ¹ng xin `Record X-Lock` trĂªn cĂ¹ng má»™t báº£n ghi Primary Key `MaCapSo`:
    - InnoDB Lock Manager tuáº§n tá»± hĂ³a 3 yĂªu cáº§u xin khĂ³a.
    - Tiáº¿n trĂ¬nh Ä‘Æ°á»£c cáº¥p khĂ³a trÆ°á»›c (vĂ­ dá»¥ A): Khá»›p `FenceToken = 1` $\rightarrow$ chuyá»ƒn `DA_SU_DUNG` $\rightarrow$ Commit Tx2.
    - Hai tiáº¿n trĂ¬nh Ä‘áº¿n sau (B vĂ  Worker) láº§n lÆ°á»£t nháº­n khĂ³a X-lock sau khi A giáº£i phĂ³ng, nhÆ°ng Ä‘iá»u kiá»‡n `WHERE TrangThai = 'DANG_XU_LY'` khĂ´ng cĂ²n thá»a mĂ£n $\rightarrow$ Cáº£ 2 Ä‘á»u nháº­n `affected_rows = 0` vĂ  rĂºt lui an toĂ n.
- **Wait-For Graph:**
  $$\text{Xáº¿p hĂ ng tuáº§n tá»± hĂ³a trĂªn 1 tĂ i nguyĂªn duy nháº¥t} \implies \text{KHĂ”NG THá»‚ CĂ“ DEADLOCK CHU TRĂŒNH}.$$

---

### PHáº¦N IV. BLOCKER B-52: ATOMICITY VĂ€ GIá»I Háº N Cá»¦A `DB::afterCommit()`

#### 1. PhĂ¢n Loáº¡i ToĂ n Bá»™ CĂ¡c Dáº¡ng Side-Effects Trong Há»‡ Thá»‘ng

```text
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| LOáº I SIDE-EFFECT          | KĂNH THá»°C THI         | Vá» TRĂ Gá»ŒI            | Náº°M TRONG TX2? | CĂ™NG Káº¾T Ná»I PDO?  | KHáº¢ NÄ‚NG ROLLBACK KHI TX2 THáº¤T Báº I         |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 1. ThĂ´ng bĂ¡o ná»™i bá»™       | Báº£ng MySQL thong_bao  | NotificationService   | **CĂ“**         | **CĂ™NG MASTER PDO**| **100% HOĂ€N TĂC Tá»° Äá»˜NG Bá»I INNODB**       |
|    (In-App Notification)  |                       | L20 (gá»i tá»« L307, 316)|                |                    | (Báº£n ghi biáº¿n máº¥t sáº¡ch sáº½ sau Rollback)     |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 2. Broadcast thá»i gian    | WebSocket Reverb /    | Äá» xuáº¥t Giai Ä‘oáº¡n 3   | **KHĂ”NG**      | KhĂ´ng qua DB       | **KHĂ”NG THá»‚ ROLLBACK QUA SQL**             |
|    thá»±c (Realtime Push)   | Pusher                |                       |                |                    | (Náº¿u Ä‘Ă£ gá»­i gĂ³i tin máº¡ng thĂ¬ khĂ´ng rĂºt láº¡i)|
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 3. Tin nháº¯n SMS / Zalo    | Cá»•ng Gateway ngoĂ i    | Äá» xuáº¥t Giai Ä‘oáº¡n 3   | **KHĂ”NG**      | KhĂ´ng qua DB       | **KHĂ”NG THá»‚ ROLLBACK QUA SQL**             |
|    ZNS / OTT              | (HTTP REST API)       |                       |                |                    | (Bá»‡nh nhĂ¢n Ä‘Ă£ nháº­n SMS khĂ´ng thá»ƒ thu há»“i)  |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

---

#### 2. PhĂ¢n TĂ­ch Giá»›i Háº¡n Cá»§a `DB::afterCommit()` VĂ  Sá»± Cáº§n Thiáº¿t Cá»§a Transactional Outbox

> [!WARNING] PHáº¢N BIá»†N Ká»¸ THUáº¬T Vá»€ `DB::afterCommit()`:
> - `DB::afterCommit()` chá»‰ giáº£i quyáº¿t Ä‘Æ°á»£c **chiá»u thuáº­n**: NgÄƒn khĂ´ng cho phĂ¡t sá»± kiá»‡n máº¡ng trÆ°á»›c khi transaction commit thĂ nh cĂ´ng vĂ o database.
> - **Ká»CH Báº¢N THáº¤T Báº I Cá»¦A `afterCommit()`:**
>   1. MySQL commit thĂ nh cĂ´ng trĂªn Ä‘Ä©a cá»©ng.
>   2. TrÆ°á»›c khi Laravel ká»‹p thá»±c thi callback trong bá»™ nhá»› RAM, mĂ¡y chá»§ web bá»‹ máº¥t Ä‘iá»‡n Ä‘á»™t ngá»™t, container bá»‹ Kubernetes kill (OOMKilled), hoáº·c tiáº¿n trĂ¬nh PHP-FPM bá»‹ worker timeout cháº¿t báº¥t Ä‘áº¯c dÄ©!
>   3. $\rightarrow$ **Sá»° KIá»†N Bá» Máº¤T VÄ¨NH VIá»„N!** LÆ°á»£t khĂ¡m Ä‘Ă£ táº¡o thĂ nh cĂ´ng trong DB nhÆ°ng khĂ´ng cĂ³ báº¥t ká»³ thĂ´ng bĂ¡o WebSocket nĂ o Ä‘Æ°á»£c phĂ¡t vĂ  khĂ´ng cĂ³ tin nháº¯n SMS nĂ o Ä‘Æ°á»£c gá»­i!
>   4. `afterCommit` hoĂ n toĂ n **khĂ´ng cĂ³ cÆ¡ cháº¿ retry**, **khĂ´ng cĂ³ persistence lÆ°u trá»¯ bá»n vá»¯ng**, vĂ  **khĂ´ng Ä‘áº£m báº£o At-Least-Once Delivery**.

##### Káº¿t luáº­n kiáº¿n trĂºc:
- Äá»‘i vá»›i **WebSocket thá»i gian thá»±c (UI Toast / Real-time queue)**: CĂ³ thá»ƒ cháº¥p nháº­n sá»­ dá»¥ng `DB::afterCommit()` vĂ¬ náº¿u rá»›t máº¡ng, client frontend cĂ³ cÆ¡ cháº¿ Polling dá»± phĂ²ng má»—i 3-5 giĂ¢y Ä‘á»ƒ bĂ¹ Ä‘áº¯p sá»± kiá»‡n bá»‹ máº¥t.
- Äá»‘i vá»›i **SMS, Zalo ZNS, hĂ³a Ä‘Æ¡n tĂ i chĂ­nh hoáº·c tĂ­ch há»£p bá»‡nh viá»‡n**: **Báº®T BUá»˜C PHáº¢I DĂ™NG TRANSACTIONAL OUTBOX PATTERN** trong Giai Ä‘oáº¡n 3:
  - Báº£ng `outbox_messages` Ä‘Æ°á»£c chĂ¨n cĂ¹ng má»™t transaction vá»›i `luot_kham`.
  - Má»™t Background Worker Ä‘á»™c láº­p Ä‘á»c cĂ¡c báº£n ghi `PENDING`, gá»­i qua Gateway cĂ³ kĂ¨m `Idempotency-Key`, cáº­p nháº­t `SENT` hoáº·c `RETRY` cĂ³ exponential backoff, Ä‘áº£m báº£o Ä‘á»™ tin cáº­y 100%.

---

### PHáº¦N V. BLOCKER B-53: KIá»‚M Äá»NH STATE MACHINE VĂ€ FENCING TOKEN

#### 1. Báº£ng RĂ  SoĂ¡t Chi Tiáº¿t 6 Transition NguyĂªn Tá»­ Cá»§a Ledger

```text
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| TRANSITION        | TRáº NG THĂI TRÆ¯á»C/SAU   | ÄIá»€U KIá»†N WHERE Báº®T BUá»˜C                          | FENCE TOKEN     | LEASE CHECK       | AFFECTED | BOUNDARY      |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 1. Request Claim  | DA_CAP -> DANG_XU_LY   | IdempotencyKey = :k AND TrangThai = 'DA_CAP'      | TÄƒng: 0 -> 1    | Lease = NOW()+60s | 1        | Tx1 Claim     |
|                   |                        |                                                   |                 |                   |          | (Autonomous)  |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 2. Request Reclaim| DANG_XU_LY ->          | IdempotencyKey = :k AND TrangThai = 'DANG_XU_LY'  | TÄƒng:           | Lease = NOW()+60s | 1        | Tx1 Claim     |
|    khi quĂ¡ háº¡n    | DANG_XU_LY             | AND LeaseExpiresAt < NOW()                        | (OldToken + 1)  |                   |          | (Autonomous)  |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 3. Request        | DANG_XU_LY ->          | MaCapSo = :id AND TrangThai = 'DANG_XU_LY'        | Báº¯t buá»™c khá»›p:  | KhĂ´ng cáº§n check   | 1        | BÆ°á»›c cuá»‘i     |
|    Finalize       | DA_SU_DUNG             | AND FenceToken = :assignedToken                   | token chĂ­nh chá»§ | vĂ¬ token báº£o vá»‡   |          | Business Tx2  |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 4. Worker Void    | DANG_XU_LY -> DA_HUY   | MaCapSo = :id AND TrangThai = 'DANG_XU_LY'        | Báº¯t buá»™c khá»›p:  | LeaseExpiresAt <  | 1        | Worker Tx     |
|    sau 5 phĂºt     |                        | AND FenceToken = :readToken                       | token lĂºc Ä‘á»c   | NOW() - 5 phĂºt    |          | Äá»‘i SoĂ¡t      |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 5. Worker         | DANG_XU_LY ->          | MaCapSo = :id AND TrangThai = 'DANG_XU_LY'        | Báº¯t buá»™c khá»›p:  | ÄĂ£ kiá»ƒm tra tháº¥y  | 1        | Worker Tx     |
|    Reconcile      | DA_SU_DUNG             | AND FenceToken = :readToken                       | token lĂºc Ä‘á»c   | luot_kham tá»“n táº¡i |          | Äá»‘i SoĂ¡t      |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
| 6. Void Orphan    | DA_CAP -> DA_HUY       | MaCapSo = :id AND TrangThai = 'DA_CAP'            | FenceToken = 0  | CreatedAt <       | 1        | Worker Tx     |
|    sau 15 phĂºt    |                        |                                                   |                 | NOW() - 15 phĂºt   |          | Dá»n Dáº¹p       |
+-------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

---

#### 2. Tráº£ Lá»i Ráº¡ch RĂ²i 4 CĂ¢u Há»i Kiá»ƒm Äá»‹nh State Machine

1. **Worker cĂ³ thá»ƒ void má»™t request cĂ²n Ä‘ang cháº¡y khĂ´ng?**
   - **TRáº¢ Lá»œI:**
     - Náº¿u Request Ä‘ang giá»¯ X-lock trĂªn `luot_kham`, Worker bá»‹ Lock Wait khi Ä‘á»c `luot_kham` $\rightarrow$ Worker khĂ´ng thá»ƒ void trÆ°á»›c khi Request káº¿t thĂºc.
     - Náº¿u Request bá»‹ treo mĂ¡y tĂ­nh toĂ¡n $> 5$ phĂºt trÆ°á»›c khi chĂ¨n `luot_kham`, Worker void thĂ nh cĂ´ng vá»›i `FenceToken = 1`. Khi Request thá»©c dáº­y cháº¡y Ä‘áº¿n bÆ°á»›c chá»‘t cuá»‘i Tx2, Request kiá»ƒm tra `WHERE TrangThai = 'DANG_XU_LY' AND FenceToken = 1` $\rightarrow$ Nháº­n `affected_rows = 0` $\rightarrow$ Request buá»™c pháº£i rollback. **ToĂ n váº¹n dá»¯ liá»‡u Ä‘Æ°á»£c báº£o vá»‡ tuyá»‡t Ä‘á»‘i.**
2. **Request cÅ© cĂ³ thá»ƒ ghi dá»¯ liá»‡u sau khi token bá»‹ tÄƒng hay khĂ´ng?**
   - **TRáº¢ Lá»œI: TUYá»†T Äá»I KHĂ”NG.** Request cÅ© chá»‰ cáº§m token cÅ© (vĂ­ dá»¥ 1). Khi token trong DB Ä‘Ă£ tÄƒng lĂªn 2 do Reclaim, cĂ¢u lá»‡nh `WHERE FenceToken = 1` tráº£ vá» `affected_rows = 0`, kĂ­ch hoáº¡t rollback toĂ n bá»™ Tx2 cá»§a request cÅ©.
3. **CĂ¡c thao tĂ¡c ghi nghiá»‡p vá»¥ cĂ³ thá»±c sá»± náº±m trong cĂ¹ng transaction vá»›i final fencing check khĂ´ng?**
   - **TRáº¢ Lá»œI: CĂ“.** ToĂ n bá»™ cĂ¡c thao tĂ¡c: `INSERT luot_kham`, `UPDATE lich_hen`, `UPDATE so_cap_so_phieu` vĂ  `INSERT thong_bao` Ä‘á»u náº±m bĂªn trong khá»‘i `DB::transaction(...)` cá»§a Tx2 trĂªn cĂ¹ng má»™t káº¿t ná»‘i PDO Master.
4. **Náº¿u final fencing check tháº¥t báº¡i thĂ¬ táº¥t cáº£ ghi nghiá»‡p vá»¥ cĂ³ rollback khĂ´ng?**
   - **TRáº¢ Lá»œI: CĂ“.** Khi cĂ¢u lá»‡nh UPDATE ledger tráº£ vá» `affected_rows = 0`, mĂ£ nguá»“n chá»§ Ä‘á»™ng nĂ©m ngoáº¡i lá»‡ hoáº·c gá»i `DB::rollBack()`. Theo cÆ¡ cháº¿ ACID cá»§a MySQL InnoDB, toĂ n bá»™ cĂ¡c báº£n ghi `luot_kham`, `lich_hen` vĂ  `thong_bao` vá»«a ghi trong Tx2 Ä‘á»u bá»‹ xĂ³a sáº¡ch bá»Ÿi Undo Log.

---

### PHáº¦N VI. BLOCKER B-54: KIá»‚M Äá»NH VĂ€ Má» Rá»˜NG MA TRáº¬N TEST CASES (V2.7)

Äá»ƒ bao phá»§ toĂ n bá»™ cĂ¡c phĂ¡t hiá»‡n ká»¹ thuáº­t sĂ¢u sáº¯c trong B-50, B-51 vĂ  B-52, ma tráº­n kiá»ƒm thá»­ Ä‘Æ°á»£c má»Ÿ rá»™ng thĂªm 6 test cases concurrency chuyĂªn sĂ¢u:

```text
+-----------------------------------------------------------------------------------------------------------------------------------+
| TEST ID      | Má»¤C TIĂU KIá»‚M THá»¬ Má»I Bá»” SUNG TRONG V2.7                                            | PHÆ¯Æ NG THá»¨C    | Má»¨C Äá»˜      |
+-----------------------------------------------------------------------------------------------------------------------------------+
| TC-CON-019   | Kiá»ƒm chá»©ng Unknown Commit Result vĂ  kháº£ nÄƒng idempotency recovery khi máº¡ng Ä‘á»©t     | 2-Process CLI  | BLOCKER     |
|              | ngay táº¡i thá»i Ä‘iá»ƒm MySQL gá»­i gĂ³i tin commit OK vá» cho client.                       |                |             |
+-----------------------------------------------------------------------------------------------------------------------------------+
| TC-CON-020   | Kiá»ƒm tra chá»‘t cháº·n Autonomous Guard: NĂ©m LogicException cháº·n Ä‘á»©ng viá»‡c gá»i          | PHPUnit Auto   | CRITICAL    |
|              | claimTicketLedgerSafe bĂªn trong má»™t transaction Ä‘Ă£ má»Ÿ sáºµn (transactionLevel > 0).   |                |             |
+-----------------------------------------------------------------------------------------------------------------------------------+
| TC-CON-021   | PhĂ¢n biá»‡t cÆ¡ cháº¿ xá»­ lĂ½ InnoDB Error 1213 (Engine tá»± rollback toĂ n transaction)      | 2-Process CLI  | BLOCKER     |
|              | so vá»›i Error 1205 (Chá»‰ rollback cĂ¢u lá»‡nh hiá»‡n táº¡i, báº¯t buá»™c gá»i rollBack tÆ°á»ng minh)|                |             |
+-----------------------------------------------------------------------------------------------------------------------------------+
| TC-CON-022   | MĂ´ phá»ng tiáº¿n trĂ¬nh PHP bá»‹ crash/kill ngay sau khi commit DB thĂ nh cĂ´ng nhÆ°ng trÆ°á»›c | 2-Process CLI  | CRITICAL    |
|              | khi afterCommit callback cháº¡y, chá»©ng minh sá»± kiá»‡n broadcast bá»‹ máº¥t.                 |                |             |
+-----------------------------------------------------------------------------------------------------------------------------------+
| TC-CON-023   | MĂ´ phá»ng Timeline D: A finalize, B reclaim vĂ  Worker void cĂ¹ng tranh cháº¥p Exclusive | 2-Process CLI  | BLOCKER     |
|              | Row Lock trĂªn cĂ¹ng má»™t báº£n ghi ledger táº¡i cĂ¹ng microsecond.                         |                |             |
+-----------------------------------------------------------------------------------------------------------------------------------+
| TC-CON-024   | Äo lÆ°á»ng hĂ nh vi Gap Lock thá»±c táº¿ trĂªn Unique Index SoPhieu khi Worker cháº¡y         | 2-Process CLI  | BLOCKER     |
|              | SELECT ... FOR SHARE Ä‘á»‘i Ä‘áº§u vá»›i Request Ä‘ang xin Insert Intention Lock.            |                |             |
+-----------------------------------------------------------------------------------------------------------------------------------+
```

#### Báº£ng Tá»•ng Há»£p Kiá»ƒm Äáº¿m Ma Tráº­n ToĂ n Diá»‡n V2.7
- **Sá»‘ test case cá»‘t lĂµi (Core Test Suite):** **62 Test Cases** (28 PHPUnit, 24 Concurrency CLI, 10 UI Manual).
- **Sá»‘ test case phá»¥ lá»¥c (Appendix DDL):** **11 Test Cases** (5 FK Integrity, 6 Migration Steps).
- **Tá»•ng cá»™ng:** **73 Test Cases**.
- **Tráº¡ng thĂ¡i thá»±c thi:** **`CHÆ¯A THá»°C THI (NOT TESTED) 100%`**. KhĂ´ng cĂ³ báº¥t ká»³ test nĂ o Ä‘Æ°á»£c Ä‘Ă¡nh dáº¥u PASS áº£o.

---

### PHáº¦N VII. Tá»”NG Káº¾T Báº¢NG GATEKEEPER & QUYáº¾T Äá»NH CHUYá»‚N BÆ¯á»C

```text
+------------------------------------------------------------------------------------------------------------------------------------------------+
| BLOCKER | Báº°NG CHá»¨NG XĂC THá»°C                   | TRáº NG THĂI KIá»‚M Äá»NH             | HĂ€NH Äá»˜NG Báº®T BUá»˜C                              | QUYáº¾T Äá»NH GATEKEEPER  |
+------------------------------------------------------------------------------------------------------------------------------------------------+
| B-49    | LuotKhamController.php L244-325       | CURRENT CODE VERIFIED            | TĂ¡ch báº¡ch tuyá»‡t Ä‘á»‘i Current Code vs Target      | ÄĂƒ Äá»I SOĂT MINH Báº CH  |
|         | INFORMATION_SCHEMA live database      | LIVE SCHEMA VERIFIED             | KhĂ´ng tuyĂªn bá»‘ code hiá»‡n táº¡i Ä‘Ă£ cĂ³ ledger       |                        |
+------------------------------------------------------------------------------------------------------------------------------------------------+
| B-50    | Laravel ManagesTransactions.php L15   | CURRENT CODE VERIFIED            | Báº¯t buá»™c dĂ¹ng pattern DB::transaction +         | ÄĂƒ CHUáº¨N HĂ“A PATTERN   |
|         | PhĂ¢n tĂ­ch lá»—i 1213 vs 1205            | THEORETICAL ANALYSIS             | ClaimConflictException vĂ  Autonomous Guard      |                        |
+------------------------------------------------------------------------------------------------------------------------------------------------+
| B-51    | MĂ´ hĂ¬nh hĂ³a 4 Timeline vá»›i InnoDB Lock| THEORETICAL ANALYSIS             | BĂ¡c bá» giáº£ Ä‘á»‹nh FIFO. Giá»›i háº¡n pháº¡m vi káº¿t luáº­n | ÄĂƒ GIá»I Háº N Káº¾T LUáº¬N   |
|         | B-Tree Gap S-Lock vs Insert Intention | NOT VERIFIED EXPERIMENTALLY      | Pháº£i cháº¡y thá»±c nghiá»‡m trĂªn DB Clone             | CHá»œ TEST TRĂN CLONE    |
+------------------------------------------------------------------------------------------------------------------------------------------------+
| B-52    | NotificationService.php L20           | CURRENT CODE VERIFIED            | DB write tá»± rollback 100%. afterCommit chá»‰ best | ÄĂƒ PHĂ‚N Äá»NH RANH GIá»I |
|         | PhĂ¢n tĂ­ch rá»§i ro máº¥t broadcast        | THEORETICAL ANALYSIS             | effort. SMS/Zalo báº¯t buá»™c Outbox trong GÄ 3     |                        |
+------------------------------------------------------------------------------------------------------------------------------------------------+
| B-53    | Äáº·c táº£ State Machine 6 Transition     | TARGET DESIGN SPECIFIED          | Chuáº©n hĂ³a Ä‘iá»u kiá»‡n WHERE, chá»‘t cháº·n token      | ÄĂƒ Äáº¶C Táº¢ HOĂ€N Táº¤T     |
+------------------------------------------------------------------------------------------------------------------------------------------------+
| B-54    | Script Python kiá»ƒm Ä‘áº¿m ma tráº­n        | CURRENT CODE VERIFIED            | Má»Ÿ rá»™ng 6 test cases má»›i cho edge cases         | ÄĂƒ Äá»’NG Bá»˜ 73 TEST     |
+------------------------------------------------------------------------------------------------------------------------------------------------+
```

```text
================================================================================
TRáº NG THĂI PHĂ DUYá»†T CHĂNH THá»¨C HIá»†N Táº I:
[ NOT APPROVED â€” NO MIGRATION â€” NO DATABASE WRITE â€” NO CLONE YET ]

LĂ½ do giá»¯ nguyĂªn tráº¡ng thĂ¡i: BĂ¡o cĂ¡o V2.7 Ä‘Ă£ giáº£i quyáº¿t dá»©t Ä‘iá»ƒm 4 váº¥n Ä‘á» cá»‘t tá»­:
1. PhĂ¢n tĂ¡ch ráº¡ch rĂ²i 100% giá»¯a Current Code/Live Schema vĂ  Target Design, khĂ´ng 
   cĂ²n báº¥t ká»³ sá»± nháº­p nháº±ng nĂ o vá» hiá»‡n tráº¡ng há»‡ thá»‘ng.
2. Kiá»ƒm Ä‘á»‹nh sĂ¢u cÆ¡ cháº¿ Transaction cá»§a Laravel 12, phĂ¢n biá»‡t báº£n cháº¥t giá»¯a lá»—i 1213 
   vĂ  1205, thiáº¿t láº­p pattern Claim an toĂ n loáº¡i trá»« cáº¡m báº«y savepoint lá»“ng nhau.
3. RĂºt láº¡i tuyĂªn bá»‘ "chá»©ng minh toĂ¡n há»c", bĂ¡c bá» giáº£ Ä‘á»‹nh FIFO, xĂ¡c Ä‘á»‹nh Ä‘Ăºng ranh 
   giá»›i khĂ³a giá»¯a Worker vĂ  Request trong pháº¡m vi cĂ¡c tĂ i nguyĂªn Ä‘Ă£ mĂ´ hĂ¬nh hĂ³a.
4. Chá»‰ rĂµ giá»›i háº¡n cá»§a DB::afterCommit() vĂ  sá»± cáº§n thiáº¿t cá»§a Transactional Outbox.

ToĂ n bá»™ há»‡ thá»‘ng lĂ½ thuyáº¿t vĂ  tĂ i liá»‡u thiáº¿t káº¿ Ä‘Ă£ Ä‘áº¡t Ä‘á»™ minh báº¡ch vĂ  ká»· luáº­t ká»¹ thuáº­t 
cao nháº¥t. TuĂ¢n thá»§ tuyá»‡t Ä‘á»‘i chá»‰ thá»‹ Gatekeeper: Dá»«ng láº¡i á»Ÿ tráº¡ng thĂ¡i CHÆ¯A PHĂ DUYá»†T, 
chá» Ä‘Ă¡nh giĂ¡ vĂ  cáº¥p phĂ©p chĂ­nh thá»©c tá»« Quáº£n trá»‹ viĂªn trÆ°á»›c khi bÆ°á»›c sang giai Ä‘oáº¡n 
thiáº¿t láº­p Database Clone Ä‘á»™c láº­p.
================================================================================
```
