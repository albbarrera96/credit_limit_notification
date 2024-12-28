/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @Company Entropy Technologies
 * @Author Alberto Barrera Aponte
*/

import { EntryPoints } from 'N/types';
import * as log from 'N/log';
import * as record from 'N/record';
import * as email from 'N/email';
import * as runtime from 'N/runtime';

function afterSubmit(context: EntryPoints.UserEvent.afterSubmitContext) : void {
    if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT) {
        return;
    }
    try {
        const sales_order = context.newRecord;
        const customer_id = sales_order.getValue({ fieldId: 'entity' }) as number;

        if (!customer_id) {
            log.error('Missing Customer ID', 'No customer ID found on the Sales Order.');
            return;
        }

        // Cargar el registro del cliente
        const customer_record = record.load({ type: record.Type.CUSTOMER, id: customer_id });
        const credit_limit = customer_record.getValue({ fieldId: 'creditlimit' }) as number;
        const balance = customer_record.getValue({ fieldId: 'balance' }) as number;

        // Validar si el balance excede el límite de crédito
        if (balance > credit_limit) {
            log.error('Credit Limit Exceeded', `Customer ${customer_id} has exceeded their credit limit.`);

            // Obtener el destinatario dinámico desde los parámetros del script
            const script_obj = runtime.getCurrentScript();
            const recipient = script_obj.getParameter({ name: 'custscript_dynamic_email_recipient' }) as string;
            
            if (!recipient) {
                log.error('Missing Email Recipient', 'No email recipient defined in the script parameter.');
                return;
            }

            // Enviar correo al equipo de crédito
            email.send({
                author: -5, // -5 representa el remitente por defecto
                recipients: recipient,
                subject: 'Credit Limit Exceeded',
                body: `Customer ${customer_id} has exceeded their credit limit. \n\nCurrent Balance: ${balance} \nCredit Limit: ${credit_limit}`
            });
        }
    } catch (error) {
        log.error('Error in afterSubmit', error.message);
    }
}

export = {
    afterSubmit
}