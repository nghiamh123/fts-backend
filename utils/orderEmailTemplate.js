function formatVND(n) {
  return new Intl.NumberFormat("vi-VN").format(n) + "₫";
}

export function buildNewOrderEmailHtml(order) {
  const { orderNumber, email, items, shippingAddress, subtotal, shippingFee, discount, note, createdAt } = order;
  const total = (subtotal || 0) - (discount || 0) + (shippingFee || 0);

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;">${item.name || item.productId}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;">${item.size || "-"}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;">${item.quantity}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;">${formatVND(item.price)}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;">${formatVND(item.price * item.quantity)}</td>
      </tr>`,
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
      <h2 style="background:#000;color:#fff;padding:16px;margin:0;text-align:center;">
        ĐƠN HÀNG MỚI - ${orderNumber}
      </h2>

      <div style="padding:16px;border:1px solid #eee;">
        <p><strong>Thời gian:</strong> ${new Date(createdAt || Date.now()).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</p>
        <p><strong>Email khách:</strong> ${email}</p>

        <h3 style="margin-top:20px;">Thông tin giao hàng</h3>
        <p>
          ${shippingAddress.fullName}<br/>
          ${shippingAddress.phone}<br/>
          ${shippingAddress.address}${shippingAddress.ward ? ", " + shippingAddress.ward : ""}${shippingAddress.district ? ", " + shippingAddress.district : ""}${shippingAddress.city ? ", " + shippingAddress.city : ""}
        </p>

        ${note ? `<p><strong>Ghi chú:</strong> ${note}</p>` : ""}

        <h3 style="margin-top:20px;">Chi tiết đơn hàng</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f5f5f5;">
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Sản phẩm</th>
              <th style="padding:8px;border:1px solid #ddd;">Size</th>
              <th style="padding:8px;border:1px solid #ddd;">SL</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:right;">Đơn giá</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div style="margin-top:16px;text-align:right;font-size:14px;">
          <p>Tạm tính: <strong>${formatVND(subtotal)}</strong></p>
          ${discount > 0 ? `<p>Giảm giá: <strong style="color:green;">-${formatVND(discount)}</strong></p>` : ""}
          <p>Phí ship: <strong>${shippingFee === 0 ? "Miễn phí" : formatVND(shippingFee)}</strong></p>
          <p style="font-size:18px;color:#000;">TỔNG: <strong>${formatVND(total)}</strong></p>
        </div>
      </div>

      <p style="text-align:center;color:#999;font-size:12px;margin-top:16px;">
        Email tự động từ hệ thống FROM THE STRESS
      </p>
    </div>
  `;
}