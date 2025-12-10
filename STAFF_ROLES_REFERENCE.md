# Staff Roles Quick Reference

## 👑 Manager (Purple)
**Icon**: Shield 🛡️  
**Access Level**: Full Access

### Permissions
✅ All features and actions  
✅ Invite and manage staff  
✅ Void orders  
✅ All status transitions  
✅ View all reports  
✅ Access staff management page  

### Status Transitions
- new → accepted
- accepted → in_preparation
- in_preparation → ready
- ready → served
- served → payment_requested
- payment_requested → paid
- Any status → void

### Typical Workflow
1. Manage staff and permissions
2. Handle escalations
3. Void problematic orders
4. Override restrictions when needed
5. Monitor overall operations

---

## 🍽️ Waiter (Blue)
**Icon**: User 👤  
**Access Level**: Front of House

### Permissions
✅ Take orders  
✅ Mark orders as served  
✅ Request payment  
✅ Process payments  
✅ View active orders  
❌ Cannot access staff management  
❌ Cannot void orders  
❌ Cannot perform kitchen transitions  

### Status Transitions
- new → accepted (take order)
- served → payment_requested (present bill)
- payment_requested → paid (process payment)

### Typical Workflow
1. Take customer order
2. Send to kitchen (new → accepted)
3. Wait for food to be ready
4. Serve food (ready → served)
5. Present bill (served → payment_requested)
6. Process payment (payment_requested → paid)

---

## 👨‍🍳 Chef (Orange)
**Icon**: Chef Hat 🧑‍🍳  
**Access Level**: Kitchen Only

### Permissions
✅ View kitchen display  
✅ Accept new orders  
✅ Start preparation  
✅ Mark orders ready  
❌ Cannot access staff management  
❌ Cannot mark served  
❌ Cannot process payments  

### Status Transitions
- new → accepted (acknowledge order)
- accepted → in_preparation (start cooking)
- in_preparation → ready (food ready for pickup)

### Typical Workflow
1. Monitor Kitchen Display Screen
2. Accept incoming orders
3. Start cooking (accepted → in_preparation)
4. Complete dish (in_preparation → ready)
5. Notify runner/waiter

---

## 🚚 Runner (Green)
**Icon**: Truck 🚛  
**Access Level**: Delivery Only

### Permissions
✅ View ready orders  
✅ Mark orders as served  
❌ Cannot access staff management  
❌ Cannot take orders  
❌ Cannot perform kitchen transitions  
❌ Cannot process payments  

### Status Transitions
- ready → served (deliver to table)

### Typical Workflow
1. Monitor ready orders
2. Pick up completed dishes
3. Deliver to correct table
4. Mark as served (ready → served)

---

## 📊 Comparison Table

| Feature | Manager | Waiter | Chef | Runner |
|---------|---------|--------|------|--------|
| **Staff Management** | ✅ | ❌ | ❌ | ❌ |
| **Take Orders** | ✅ | ✅ | ❌ | ❌ |
| **Kitchen Display** | ✅ | ❌ | ✅ | ❌ |
| **Accept Orders** | ✅ | ✅ | ✅ | ❌ |
| **Start Cooking** | ✅ | ❌ | ✅ | ❌ |
| **Mark Ready** | ✅ | ❌ | ✅ | ❌ |
| **Mark Served** | ✅ | ✅ | ❌ | ✅ |
| **Request Payment** | ✅ | ✅ | ❌ | ❌ |
| **Process Payment** | ✅ | ✅ | ❌ | ❌ |
| **Void Orders** | ✅ | ❌ | ❌ | ❌ |
| **View Reports** | ✅ | ❌ | ❌ | ❌ |

---

## 🎨 Role Colors

- **Manager**: Purple (`from-purple-500 to-purple-600`)
- **Waiter**: Blue (`from-blue-500 to-blue-600`)
- **Chef**: Orange (`from-orange-500 to-orange-600`)
- **Runner**: Green (`from-green-500 to-green-600`)

---

## 🔄 Complete Order Flow

```
[New Order]
    ↓
[Waiter/Chef: Accept] → accepted
    ↓
[Chef: Start Cooking] → in_preparation
    ↓
[Chef: Mark Ready] → ready
    ↓
[Runner/Waiter: Serve] → served
    ↓
[Waiter: Request Payment] → payment_requested
    ↓
[Waiter: Process Payment] → paid
```

---

## 💡 Best Practices

### For Managers
- Set up staff accounts before opening
- Ensure all staff know their PINs
- Monitor audit trail regularly
- Use void sparingly and document reasons

### For Waiters
- Accept orders immediately after taking them
- Mark served only when food is at the table
- Request payment when customer is ready
- Double-check order details before submitting

### For Chefs
- Accept orders as soon as you see them
- Update status promptly (keeps waiters informed)
- Use notes field for special instructions
- Communicate with waiters about delays

### For Runners
- Check ready orders frequently
- Verify table number before delivery
- Mark served immediately after delivery
- Communicate with kitchen about issues

---

## 🔐 Security Notes

- **Never share your PIN** with anyone
- **Change your PIN** if you suspect it's compromised
- **Log out** when leaving your station
- **Report suspicious activity** to your manager

---

## 📞 Support

If you encounter issues:
1. Check your role permissions
2. Verify you're logged in with correct account
3. Contact your manager
4. Check the audit trail for recent changes

---

**Last Updated**: 2025-11-25  
**Version**: 1.0.0
