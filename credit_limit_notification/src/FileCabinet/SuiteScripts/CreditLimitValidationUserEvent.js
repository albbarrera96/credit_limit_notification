/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @Company Entropy Technologies
 * @Author Alberto Barrera Aponte
 */
define(["require", "exports", "N/log", "N/record", "N/email", "N/runtime"], function (require, exports, log, record, email, runtime) {
    "use strict";
    function afterSubmit(context) {
        try {
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
                var sales_order = context.newRecord;
                var customer_id = String(sales_order.getValue('entity'));
                var customer_record = record.load({
                    type: record.Type.CUSTOMER,
                    id: customer_id
                });
                var customer_name = customer_record.getValue({ fieldId: 'companyname' });
                var credit_limit = customer_record.getValue({ fieldId: 'creditlimit' });
                var balance = customer_record.getValue({ fieldId: 'unbilledorders' });
                var order_total = sales_order.getValue({ fieldId: 'total' });
                if (balance + order_total > credit_limit) {
                    var user = runtime.getCurrentUser();
                    sendEmail(balance + order_total, credit_limit, customer_name, user.id);
                    log.audit('Credit Limit Exceeded', 'Customer: ' + customer_name + ' | Credit Limit: ' + credit_limit + ' | Total Sales Order Amount: ' + balance + order_total);
                }
            }
        }
        catch (error) {
            log.error('Error in afterSubmit', error.message);
        }
    }
    function sendEmail(total, limit, customer, id) {
        try {
            email.send({
                author: id,
                recipients: runtime.getCurrentUser().email,
                subject: 'Credit Limit Exceeded',
                body: '<p>Dear ' + customer + ', </p>' +
                    '<p>We would like to inform you that the total amount of the latest Sales Order created or edited on your account exceeds your credit limit.</p>' +
                    '<p><strong>Details:</strong></p>' +
                    '<ul>' +
                    '<li>Credit Limit: ' + limit + '</li>' +
                    '<li>Total Sales Order Amount: ' + total + '</li>' +
                    '</ul>' +
                    '<p>Please take steps to address this situation as soon as possible.</p>' +
                    '<p>Sincerely,<br>The Sales Team</p>'
            });
        }
        catch (error) {
            log.error('Error in sendEmail', error.message);
        }
    }
    return {
        afterSubmit: afterSubmit
    };
});
