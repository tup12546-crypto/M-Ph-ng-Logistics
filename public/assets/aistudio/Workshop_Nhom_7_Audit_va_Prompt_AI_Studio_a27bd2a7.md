# Nâng cấp web mô phỏng vận tải cho workshop Nhóm 7

**Lệnh cho Google AI Studio** — Hãy mở dự án LOGISTICS hiện tại và triển khai các thay đổi trong tài liệu này. Trước tiên, tái hiện ba lỗi ở mục 2 trên bản sao của một phương án. Tìm nơi dự án thực sự lưu dữ liệu tuyến, tính giá, chọn kịch bản và hiển thị bản đồ. Sửa logic trước, sau đó sửa luồng chơi và giao diện. Chạy các ca nghiệm thu ở cuối file rồi trả lại bản xem thử cùng kết quả thực tế của từng ca.

**Mục tiêu buổi học.** Một nhóm lần đầu mở web phải tự nhận đơn, khảo sát các tuyến, chốt lựa chọn ban đầu, nhận tình huống Giáng sinh, rồi bảo vệ quyết định giữ hoặc đổi tuyến bằng số liệu. MC cần nhận được lý do của từng nhóm. Bản đồ phục vụ việc tìm điểm chuyển tải và giải thích sự cố.

**Phạm vi rà soát.** Kiểm tra trên bản web đang chạy ngày 19/11/2026 và đối chiếu phiếu `Workshop_nhom_7_35_ngay.docx`. Các lỗi dưới đây mô tả hành vi nhìn thấy trên giao diện. AI Studio cần kiểm tra nguyên nhân trong mã nguồn của dự án đang mở. Mức P0 cần xử lý trước khi dùng trên lớp. Mức P1 cần hoàn thành trước buổi chạy thử với người chơi.

**Các phần đã thao tác trên web**

| Phần | Thao tác đã thực hiện |
|---|---|
| Bài chính | Chọn cả A–D, xem bảng so sánh ở hai trạng thái, bật/tắt ùn tắc, đối chiếu giá gốc và phụ phí, đổi giao diện sáng/tối. |
| Bản đồ | Mở lớp tiêu chuẩn/vệ tinh, chuyển một/tất cả tuyến, mở nút và phương tiện, zoom và căn toàn tuyến. Thử hai cách mở rộng, phím Esc, bám theo xe, phát/dừng, tốc độ, tua tới 100% và đặt lại về 0%. |
| Tự thiết kế | Tạo PA-5, áp cả 8 mẫu, đổi tên/ghi chú, đổi kho xuất phát và điểm trung chuyển, thêm/xóa Duisburg, thử đường bộ/biển/sắt/hàng không, đọc cảnh báo và thử chạy tuyến lỗi. Xem hàng PA-5 ở bảng so sánh, tải lại và khôi phục 4 tuyến chuẩn. |
| Đầu ra | Bấm xuất CSV ở cả hai vòng. Mở Google Form và đọc từng câu hỏi ở giao diện người tham gia. Giới hạn xác minh của hai chức năng này được ghi tại mục 3–5. |

## 1. Dữ liệu chuẩn để sửa và kiểm thử

Lô hàng đi từ **VSIP II Bình Dương đến kho nhà máy tại Stuttgart**. Nhà máy chỉ tính đã giao khi nhận **đủ 7 pallet**. Các khoảng thời gian là ngày lịch tính từ khi xuất xưởng. Giá là USD cho cả lô đến kho. Đây là số mô phỏng của workshop.

| Tuyến | Hành trình chuẩn, chặng cuối bằng xe tải | Vòng 1 · ngày / USD | Sự cố Giáng sinh | Vòng 2 · ngày / USD |
|---|---|---:|---|---:|
| A | VSIP II → Tân Sơn Nhất → bay thẳng Frankfurt → Stuttgart | 3–5 / 14.545 | 3 pallet đầy chờ thêm 7 ngày, tăng 626,80 USD | 10–12 / 15.171,80 |
| B | VSIP II → Tân Sơn Nhất → Singapore → Frankfurt → Stuttgart | 6–8 / 14.000 | Nối chuyến chậm 3 ngày, xe giao chậm thêm 1 ngày, tăng 352,58 USD | 10–12 / 14.352,58 |
| C | VSIP II → Cái Mép – Thị Vải → tàu biển đến Hamburg → Stuttgart | 28–34 / 2.500 | Hamburg chậm 1 ngày, tăng 195 USD | 29–35 / 2.695 |
| D | VSIP II → Cái Mép – Thị Vải → tàu biển đến Jebel Ali → **xe tải sang sân bay Dubai** → bay đến Frankfurt → xe tải đến Stuttgart | 15–18 / 9.200 | Chờ xe chuyển cảng–sân bay 2 ngày, hãng giữ chỗ, tăng 212 USD | 17–20 / 9.412 |

- **Vòng 1.** Khách mong muốn nhận trong 25–30 ngày, cho phép đến ngày 35 và có thể hẹn nhận sớm. Ngân sách mục tiêu 8.000–12.000 USD. Dưới 8.000 USD là tiết kiệm nếu đạt điều kiện giao.
- **Vòng 2.** Khách chốt nhận đủ hàng chậm nhất **ngày 30**, đơn thường tối đa **12.000 USD**. Chỉ xét đến **15.000 USD** khi khách duyệt đơn khẩn. Ngày 35 vẫn là thời gian dài nhất trong bốn kịch bản, đồng thời có thể trễ 5 ngày so với lịch khách. Dùng **đầu trên của khoảng** khi đánh giá một cam kết.
- **Làm tròn.** Tính bằng giá trị số trước khi định dạng. Hiển thị theo kiểu Việt Nam, ví dụ **15.171,80 USD**. Phí A = 3 × 489 × 5 × 0,08 + 40. Phí B = 3.282,2 × 2 × 0,04 + 90. Phí C = 75 + 120. Phí D = 7 × 2 × 8 + 100. Bật lại sự cố luôn tính từ giá gốc.
- **Phần nên giữ.** Trên bốn tuyến mặc định, giá và khoảng ngày ở hai vòng đã khớp bảng trên. Giữ các chức năng xem nút trên bản đồ, tua tiến độ, so sánh tuyến và thử các mẫu mở rộng.

## 2. Ba lỗi tính và thiết kế tuyến cần tái hiện trước tiên

### P0 · Bản sao đi Hamburg nhưng nhận thời gian và sự cố Dubai

**Tái hiện.** Chọn D → mở Tự thiết kế → tạo PA-5 → trên PA-5 áp mẫu C. Chuỗi điểm đổi sang Hamburg và giá thường là 2.500 USD. Thẻ vẫn ghi **15–18 ngày, Hybrid Sea–Air** trong khi phần tính chi tiết cho **31,3 ngày**. Bật ùn tắc, thẻ chuyển thành **17–20 ngày, 9.412 USD** dù tuyến không đi Dubai. Bảng so sánh còn giữ nhận xét và danh sách điểm của D.

**Lệnh sửa.** Tách mã bản sao, mẫu đang áp dụng và hành trình thực tế. Khi đổi mẫu, cập nhật đồng thời điểm dừng, phương thức, mô hình chuyển tải, khoảng ngày, phí, nhận xét và sự cố. Thẻ, bảng so sánh, bản đồ, trình thiết kế và CSV dùng chung một kết quả tính. Tên do người chơi đặt chỉ là tên hiển thị. Khi tuyến trùng hoàn toàn mẫu C, dùng dữ liệu C. Khi người chơi sửa thành hành trình khác, chỉ áp sự cố phù hợp với chặng và điểm bị ảnh hưởng. Nếu chưa mô hình hóa được sự cố, hiện “Chưa có kịch bản cho tuyến này” và cho biết khoản nào chưa tính.

**Đạt khi** bản sao D áp nguyên mẫu C hiện **28–34 ngày / 2.500 USD** rồi **29–35 ngày / 2.695 USD** khi bật Giáng sinh. D gốc vẫn đi Dubai. Đổi tên bản sao hoặc bật/tắt sự cố nhiều lần đều không đổi kết quả.

### P0 · Áp nguyên mẫu A hoặc B làm thay đổi tổng giá

**Tái hiện.** Trong cùng bản sao, bấm mẫu A có nhãn **14.545 USD**, tổng hiển thị thành **14.455 USD**. Mẫu B ghi **14.000 USD**, tổng thành **14.105 USD**. Thử mẫu Munich cũng cho hai thông tin thời gian khác nhau: phần tính chi tiết **3,9 ngày** nhưng thẻ của bản sao từ D vẫn hiện **15–18 ngày**.

**Lệnh sửa.** Đối soát cước chặng, phí tại nút, giá trọn gói và phụ phí từng mẫu. Ví dụ D có phí xử lý Jebel Ali 114 USD trên bản đồ. Khi giải thích tổng tiền cần cho biết khoản nào đã nằm trong giá gốc. Phân biệt rõ giá trọn gói trong phiếu với giá ước tính của hành trình tự thiết kế. Chọn nguyên mẫu phải tái tạo đúng báo giá workshop. Với tuyến tự thiết kế, cho mở bảng cộng chi phí và ghi rõ số ngày ước tính là một giá trị hay một khoảng. Không mang khoảng thời gian, số hub hoặc lời bình từ mẫu trước sang.

**Đạt khi** áp lần lượt A → B → C → D trên cùng bản sao trả đúng bốn dòng ở mục 1. Bốn tuyến mở rộng Munich, đường sắt Á–Âu, Rotterdam–Duisburg và Bangkok hiển thị đúng dữ liệu của chính tuyến đang chọn.

### P0 · Tuyến sai hạ tầng vẫn có nút chạy và giá để so sánh

**Tái hiện.** Trong bản sao, chọn đường biển cho chặng đầu xuất phát từ kho VSIP II. Trình thiết kế đã cảnh báo kho thiếu hạ tầng SEA. Trong lần thử còn có cảnh báo hai đầu chặng trùng Hamburg. Thẻ vẫn có tổng phí và nút “Chạy mô phỏng” vẫn chuyển sang “Tạm dừng”. Khi đổi kho xuất phát sang Bắc Ninh, câu mô tả tuyến hợp lệ vẫn ghi xuất phát từ VSIP II.

**Lệnh sửa.** Trong bài chính, cố định kho VSIP II Bình Dương và kho nhận Stuttgart. Ở phần thử nâng cao, lọc phương thức theo hai đầu chặng, kiểm tra các chặng liền kề sau mỗi lần thêm, đổi hoặc xóa điểm. Cảnh báo đặt ngay cạnh chặng có vấn đề và chỉ cách sửa, ví dụ “Kho chưa có cảng biển. Hãy dùng xe tải đến Cái Mép trước.” Cho phép lưu nháp để học từ lỗi, khóa chạy và chốt kết quả khi tuyến chưa hợp lệ. Nếu cho chọn kho Bắc Ninh trong chế độ tự do, cập nhật tên kho ở mọi nơi.

**Đạt khi** sửa lại phương thức hợp lệ sẽ mở lại nút chạy. Thử đổi tuyến và sửa lỗi không làm mất tên hoặc ghi chú đang nhập.

## 3. Sửa luồng workshop để người chơi tự ra quyết định

| Mức | Điều đã thấy và ảnh hưởng | Lệnh triển khai |
|---|---|---|
| **P0** | Header, khối lô hàng và bảng đều ghi hạn **32 ngày**. Nút bật sự cố nằm trước bước chọn tuyến lần đầu. Một nhóm có thể xem hết vòng 2 ngay khi vào. | Tạo hai vòng theo mục 1. Đặt một thẻ “Yêu cầu hiện tại của khách” ở đầu màn hình. Bấm một tuyến chỉ là **đang xem**. Thêm nút **Chốt vòng 1** để ghi lựa chọn và lý do, sau đó mới mở **Nhận tin Giáng sinh**. Cho xem lại vòng 1 mà vẫn giữ bản ghi đã chốt. |
| **P0** | Khi xảy ra sự cố, A và B đều là 10–12 ngày, nhưng phần ưu điểm A vẫn nói “nhanh nhất (3–5 ngày)”. Các số và lời bình khiến nhóm rút ra hai kết luận khác nhau. | Sinh nhận xét theo vòng đang xem. Hiện **Ngày giao đủ muộn nhất**, **Số ngày dự phòng/trễ**, **Tổng phí** và **Còn/vượt ngân sách**. Để mô tả từng chặng dưới nút mở rộng. Trước khi chốt, cho người chơi xem bằng chứng và tự giải thích. Mở phần đối chiếu của MC sau khi chốt vòng 2. |
| **P0** | Sau khi tạo “Bản thử Hamburg”, đổi tên, nhập ghi chú rồi tải lại, giao diện trở về bốn tuyến mặc định. Nút “Đặt lại 4 PA” cũng đưa tuyến thử ra khỏi danh sách. | Lưu nháp trên thiết bị gồm tên nhóm, vòng, bản sao, ghi chú và quyết định đã chốt. Cho “Tiếp tục bài” khi tải lại. “Khôi phục tuyến mẫu” và “Bắt đầu lại bài của nhóm” phải có phạm vi rõ. Nếu thao tác sẽ xóa bài, hiển thị tên nhóm/phần dữ liệu bị xóa và cho hủy. |
| **P0** | Form thực tế có câu chọn A–D và **một câu bắt buộc trống tiêu đề, chỉ có “Tùy chọn 1”**. Phiếu chưa thu tên nhóm, hai lựa chọn và lập luận. Nội dung đáp án ghi Truck/Rail hoặc “cảng TP.HCM” trong khi bài dùng xe tải cuối tuyến và cảng Cái Mép. | Trên web, tạo bản tóm tắt cuối bài có nút **Sao chép kết quả** và **Mở phiếu nộp**. Phía chủ Form, bỏ câu trống và đồng bộ tên tuyến. Các trường cần có: tên nhóm, PA vòng 1, PA vòng 2, tổng USD, ngày giao muộn nhất, lý do giữ/đổi và điều kiện cần xác nhận. Cho nhóm ghi cả điều kiện khiến họ đổi ý. Nếu dự án không có quyền sửa Form ngoài, ghi rõ thao tác này cho chủ Form. Mở link chỉ có nghĩa là đã mở phiếu. |
| **P1** | Khi tạo PA-5, danh sách và tiêu đề bảng vẫn ghi “4 phương án” hoặc chỉ A–D, nhưng có hàng thứ năm. Trình thiết kế cho đổi mẫu ngay trên phương án đang mở. | Tách **4 tuyến của đề** khỏi **Tuyến nhóm thử**. Chỉnh một tuyến chuẩn thì đề nghị tạo bản sao, rồi thao tác trên bản sao đó. Hiện số lượng động, tên tuyến đang chỉnh và nút quay về bài chính. Đặt bốn mẫu mở rộng trong mục thử thêm. |

**Lời khách dùng nguyên văn trong vòng 2**

> Nhà máy đã chốt lịch sản xuất. Chúng tôi cần nhận đủ 7 pallet tại Stuttgart chậm nhất ngày 30. Có thể giao sớm nếu hẹn trước. Ngân sách cho đơn này tối đa 12.000 USD. Nếu đề xuất phương án khẩn, hãy giải thích vì sao cần duyệt thêm.

**Câu hỏi chốt.** “Nhóm giữ hay đổi tuyến? Hãy dùng ít nhất một con số về thời gian và một con số về chi phí. Điều gì cần xác nhận trước khi đặt dịch vụ?”

**Gợi ý cho MC sau khi các nhóm nộp.** D sử dụng 9.412 USD, giao muộn nhất ngày 20, dư 10 ngày và 2.588 USD so với ngân sách thường. Chọn D đồng nghĩa chi thêm 6.717 USD so với C để tránh khả năng giao muộn. C vẫn có lý khi hãng cam kết được ngày giao đủ trước hoặc trong ngày 30. B hợp lý cho hạn 12 ngày nếu đơn khẩn được duyệt. A cần lý do ưu tiên bay thẳng, xác nhận đủ tải và giảm ít nhất 171,80 USD để về trần khẩn. Khi chấm, phân biệt điều kiện đã có và điều kiện nhóm còn phải xin xác nhận. Giữ thứ tự A–D như nhau trước khi nhóm nộp để mọi nhóm có cơ hội tự phân tích.

## 4. Chỉnh giao diện, bản đồ và cách trình bày số liệu

| Hạng mục | Quan sát | Lệnh sửa có thể kiểm tra |
|---|---|---|
| **Màn hình đầu tiên** | Bốn khối công thức đóng gói xuất hiện trước nhiệm vụ lựa chọn tuyến. Người mới phải đọc qua các ký hiệu Gross, Vol, CBM, HUB, All-in và Trouble. | Mở đầu bằng “Giao đủ 7 pallet bo mạch từ Bình Dương đến Stuttgart”. Hiện hạn của vòng, ngân sách và nút **So sánh 4 tuyến**. Thu gọn công thức dưới **Xem cách đóng gói**. Dùng tiếng Việt làm nhãn chính, ví dụ “Tổng phí cả lô”, “Điểm chuyển tải”, “Sự cố Giáng sinh”. |
| **Số liệu đóng gói** | Đầu trang ghi Gross 3.107,2 kg, phần B tính phí kho trên 3.282,2 kg. Dòng “cao tổng mỗi pallet” ghi 139,4 cm cho cả lô. | Hiện 3.000 kg bo mạch → 3.107,2 kg cả carton → **3.282,2 kg cả 7 pallet**, giả định 25 kg/vỏ pallet. Sáu pallet đủ cao 139,4 cm, pallet lẻ cao 114,4 cm. **1.167 kg** là thể tích quy đổi của 134 thùng rời. Theo quy cách xếp pallet trong bài, 9,12768 m³ quy đổi **1.521,28 kg** với hệ số 6.000. Gắn đúng đơn vị và cơ sở cho từng số. |
| **Tên cảng và điểm trung chuyển** | Áp mẫu mở rộng Rotterdam, thẻ và ghi chú ghi Cát Lái nhưng chặng 1–2 lại ghi Cái Mép – Thị Vải. Với D, mô tả tắt “Truck → Sea → Air → Truck” che mất chặng xe Jebel Ali → sân bay Dubai. | Sinh tên chặng, mã nút, lời mô tả và chuỗi bản đồ từ cùng danh sách điểm. Với mẫu Rotterdam, đối chiếu ý đồ cảng gốc rồi sửa cả nhãn lẫn điểm bản đồ cho khớp. Với D, hiện đủ năm chặng và đánh dấu chặng xe tại UAE là nơi phát sinh sự cố. Phân biệt số chặng, số điểm dừng và số lần chuyển tải. |
| **Thẻ so sánh và độ tin cậy** | Cùng một tuyến được lặp ở thẻ, chỉ số, bản đồ và bảng dài. Khi bật sự cố, % độ tin cậy đổi từ A/B/C/D = 90/78/62/88 thành 78/66/50/76. Bảng không giải thích cách suy ra mức giảm này. | Bảng đọc nhanh chỉ cần tuyến, khoảng ngày, tổng phí và điều kiện khách. Bấm vào hàng để xem cước gốc, phụ phí và lý do trễ. Nếu giữ chỉ số độ tin cậy, ghi rõ phương pháp và đây là giả định workshop. Dùng chữ “Đúng hạn”, “Có thể trễ”, “Cần duyệt khẩn” cạnh màu để người chơi tự đọc được. |
| **Bản đồ khi chiếu lớp** | Đã mở điểm số 3 trên D, tooltip cho biết Jebel Ali, 8 giờ xử lý và 114 USD phí tại nút. Ở khung rộng khoảng 1.348 px, thanh phát che một phần chú giải phương thức phía dưới. Có nhiều nút toàn tuyến, toàn màn hình và bám theo xe. | Giữ nút chính **Chạy/Tạm dừng** và **Xem toàn tuyến**. Gom tốc độ, bám xe, lớp bản đồ và toàn màn hình vào **Điều khiển bản đồ**. Tách chú giải khỏi thanh phát. Khi bấm một nút trên tuyến, hiện tên, chặng vào/ra và sự cố của vòng đó. Phân biệt phí xử lý bình thường tại nút với phụ phí Giáng sinh để người chơi không cộng hai lần. |
| **Màn hình hẹp và khả năng đọc** | Ở một lần đo khi mở phần thiết kế, vùng xem rộng **485 px** trong khi nội dung rộng **531 px**. Ảnh màn hình cũng có thanh cuộn ngang toàn trang. | Dùng thẻ xếp dọc trên điện thoại. Nếu bảng cần cuộn ngang thì giới hạn cuộn trong bảng. Cho tên cảng dài xuống dòng. Giữ nhãn hoặc tên truy cập cho nút chỉ có biểu tượng. Dùng cỡ chữ nội dung khoảng 16 px, vùng bấm chính khoảng 44 × 44 px. Kiểm tra nền sáng, nền tối, phím Tab/Enter/Esc và chế độ chiếu lớp. |
| **Độ mượt** | Chạy/dừng, tốc độ 0,5×/1×/2×, thanh tiến độ và phím Esc ở chế độ mở rộng đều đã thao tác được. Tiêu đề ghi “60fps”, chưa đo tốc độ khung hình hoặc thử trên điện thoại thật. | Chỉ cập nhật vị trí phương tiện khi phát, tách cập nhật đó khỏi việc tính lại bảng giá. Khi dừng, đổi tuyến hoặc rời chế độ bản đồ, dọn vòng lặp và lớp bản đồ cũ. Nếu nền bản đồ tải chậm, vẫn cho đọc chuỗi chặng, tính và chốt phương án. Ưu tiên đường tuyến và điểm dừng dễ đọc trên máy chiếu. |
| **Xuất CSV** | Đã bấm xuất ở cả vòng thường và vòng sự cố. Phiên kiểm tra không nhận được tệp hoàn tất để đọc, nên nội dung và mã hóa CSV còn cần xác minh. | Ghi rõ “Xuất bảng so sánh” và phạm vi vòng đang xem. Xuất UTF-8, giữ tiếng Việt, ghi rõ đơn vị, có mã PA, tên, vòng, ngày sớm/muộn, giá gốc, phụ phí, tổng và trạng thái so với khách. Dùng cùng dữ liệu với màn hình. Mở tệp thật bằng Excel hoặc Sheets để kiểm tra cột số. Khi tải bị chặn, cho sao chép bảng. |

## 5. Kịch bản nghiệm thu trước khi đưa lên lớp

Chạy theo thứ tự trên bản xem thử. Ghi **Đạt / Chưa đạt / Chưa kiểm tra** và kết quả quan sát được cho từng dòng.

| Ca | Thao tác | Kết quả phải thấy |
|---|---|---|
| 01 · Người mới | Mở trang lần đầu trên điện thoại. Nhờ một bạn chưa xem đề thử chơi, MC chưa hướng dẫn. | Bạn nhận ra phải giao đủ 7 pallet, tìm được hạn/ngân sách và tự chốt lựa chọn vòng 1. Có thể xem các tuyến khác mà chưa đổi quyết định đã chốt. |
| 02 · Chuyển vòng | Chốt C ở vòng đầu. Nhận tin Giáng sinh. | Vòng đầu C có thể giao ngày 34 trong hạn 35. Vòng sau C có thể giao ngày 35, trễ 5 ngày so với hạn 30. Bản ghi vòng 1 còn nguyên. |
| 03 · Số liệu | Đối chiếu cả 4 tuyến qua hai vòng. Xem lại kịch bản hai lần. | Tám cặp giá/ngày khớp mục 1. Với bản tự thiết kế thực sự vượt 35 ngày, báo vượt giới hạn bài thay vì cắt thời gian về 35. Phụ phí mỗi vòng chỉ cộng một lần. A tính ngày giao đủ 7 pallet, kể cả 3 pallet đi sau. |
| 04 · Tư duy | Chọn D trong đơn thường. Sau đó thử lập luận cho C hoặc B trong điều kiện khác. | D đúng hạn và đúng ngân sách. Hệ thống cho ghi điều kiện bổ sung của C/B, phân biệt đề xuất có điều kiện với đơn đã được khách duyệt. |
| 05 · Bản sao | Từ D tạo bản sao, áp mẫu C, đổi tên rồi bật Giáng sinh. Thử tiếp cả tám mẫu. | Với C, mọi vị trí hiển thị Hamburg và 2.695 USD. Mẫu A/B nguyên vẹn có giá cơ sở tương ứng 14.545/14.000 USD. Các tuyến thử có số chặng, thời gian và mô hình đúng với cấu hình mới. |
| 06 · Nút và phương thức | Thêm/xóa điểm trung chuyển, chọn hai nút trùng nhau, chọn tàu biển tại kho rồi sửa lại. | Chỉ đúng chặng lỗi, nói cách sửa. Tuyến lỗi chưa thể chốt. Khi hợp lệ, kết quả tính và bản đồ hoạt động trở lại. |
| 07 · Bản đồ | Đổi sáng/tối, vệ tinh/tiêu chuẩn, một/tất cả tuyến. Xem điểm, zoom, mở rộng, phát/dừng, đổi tốc độ, tua 0–100%, nhấn Esc, đặt lại hành trình. | D có 5 chặng. Ở 100% là kho Stuttgart. Tua về 0% là VSIP II. Nhãn, phương tiện và chặng hiện tại khớp. Đổi tuyến nhiều lần không chồng dấu hoặc tăng tốc ngoài ý muốn. |
| 08 · Thiết bị và mạng | Thử khung 390, 768 và 1366 px, bàn phím, một điện thoại thật và máy chiếu của lớp. Thử nền bản đồ tải chậm. | Trang không tràn ngang, chú giải và nút không che nhau. Chọn tuyến và bấm dừng có phản hồi ngay. Bảng giá, chuỗi chặng và phiếu quyết định dùng được trong lúc chờ bản đồ. |
| 09 · Lưu bài | Nhập tên nhóm, chốt vòng 1, ghi lý do vòng 2 rồi tải lại. Bấm bắt đầu lại và chọn hủy. | Đúng nhóm tiếp tục được ở đúng vòng. Câu trả lời và tuyến tự tạo còn nguyên. Chỉ xóa khi người dùng xác nhận phạm vi xóa. |
| 10 · CSV | Xuất từng vòng, mở tệp, kiểm tra D và B. Thử một tên tuyến có dấu phẩy và tiếng Việt. | D vòng 1 = 9.200 USD, vòng 2 = 9.412 USD. B vòng 2 = 14.352,58 USD. Cột số tính tổng được, tên tuyến không tách cột, bản xuất khớp vòng trên màn hình. |
| 11 · Nộp bài | Sao chép tóm tắt, mở Form, kiểm tra các trường và quay lại web. Chủ Form diễn tập nộp trên phiếu thử. | Nhóm giữ được quyết định và lập luận. MC đọc được hai lựa chọn cùng lý do. Không còn câu bắt buộc “Tùy chọn 1”. Có cách chuyển kết quả nếu Form tạm thời không mở được. |

**Báo cáo lại cho chủ workshop.** Liệt kê phần đã sửa, kết quả 11 ca nghiệm thu, thao tác chủ Google Form còn phải làm và hạng mục cần chạy trên thiết bị thật. Trong lượt rà soát ban đầu đã mở Form nhưng chưa gửi câu trả lời, chưa kiểm tra dữ liệu phía người nhận. Tệp CSV, hiệu năng trên điện thoại thật và trải nghiệm của một người chơi mới là các bước cần diễn tập trước buổi học.

**Tài liệu đối chiếu.** [Web mô phỏng đang dùng](https://remix-multimodal-logistics-simulator-9447.ai.studio/?zarsrc=30&utm_source=zalo&utm_medium=zalo&utm_campaign=zalo) · [Biểu mẫu nộp bài đã mở](https://docs.google.com/forms/d/e/1FAIpQLScu-xsJ0ZfhGP3SnsU2Tae4ez3c56mvCEcD1zZfyiId8IlGsA/viewform) · Phiếu Workshop Nhóm 7 bản cập nhật 35 ngày, có cột phản hồi khách hàng.
