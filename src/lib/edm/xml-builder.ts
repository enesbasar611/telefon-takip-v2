/**
 * EDM Bilişim UBL 2.1 XML Builder
 * e-Fatura / e-Arşiv uyumlu minimal UBL üreticisi.
 */

export interface UblInvoiceData {
    uuid: string;
    invoiceId: string;
    issueDate: string;
    invoiceScenario: string;
    invoiceType: string;
    currency: string;
    note?: string;
    sender: {
        vkn: string;
        name: string;
        address: string;
        city: string;
        district: string;
        country: string;
        taxOffice?: string;
        email?: string;
        phone?: string;
    };
    receiver: {
        vkn: string;
        name: string;
        address: string;
        city: string;
        district: string;
        country: string;
        taxOffice?: string;
        email?: string;
        phone?: string;
        alias?: string;
    };
    items: Array<{
        name: string;
        quantity: number;
        unitPrice: number;
        vatRate: number;
        unitCode?: string;
    }>;
}

function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
        return c;
    });
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toISOString().split('T')[0];
}

export function buildInvoiceUblXml(data: UblInvoiceData): string {
    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxTotal = data.items.reduce((sum, item) => {
        const lineTotal = item.quantity * item.unitPrice;
        return sum + (lineTotal * (item.vatRate / 100));
    }, 0);
    const grandTotal = subtotal + taxTotal;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" 
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" 
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2" 
         xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
         xmlns:ds="http://www.w3.org/2000/09/xmldsig#" 
         xsi:schemaLocation="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2 UBL-Invoice-2.1.xsd" 
         xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
    <ext:UBLExtensions>
        <ext:UBLExtension>
            <ext:ExtensionContent/>
        </ext:UBLExtension>
    </ext:UBLExtensions>
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
    <cbc:ProfileID>${data.invoiceScenario}</cbc:ProfileID>
    <cbc:ID>${data.invoiceId}</cbc:ID>
    <cbc:CopyIndicator>false</cbc:CopyIndicator>
    <cbc:UUID>${data.uuid}</cbc:UUID>
    <cbc:IssueDate>${formatDate(data.issueDate)}</cbc:IssueDate>
    <cbc:IssueTime>${new Date(data.issueDate).toLocaleTimeString('tr-TR', { hour12: false })}</cbc:IssueTime>
    <cbc:InvoiceTypeCode>${data.invoiceType}</cbc:InvoiceTypeCode>
    <cbc:Note>${escapeXml(data.note || '')}</cbc:Note>
    <cbc:DocumentCurrencyCode>${data.currency}</cbc:DocumentCurrencyCode>
    <cbc:LineCountNumeric>${data.items.length}</cbc:LineCountNumeric>

    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="VKN">${data.sender.vkn}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name>${escapeXml(data.sender.name)}</cbc:Name>
            </cac:PartyName>
            <cac:PostalAddress>
                <cbc:StreetName>${escapeXml(data.sender.address)}</cbc:StreetName>
                <cbc:CitySubdivisionName>${escapeXml(data.sender.district)}</cbc:CitySubdivisionName>
                <cbc:CityName>${escapeXml(data.sender.city)}</cbc:CityName>
                <cac:Country>
                    <cbc:Name>${escapeXml(data.sender.country)}</cbc:Name>
                </cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cac:TaxScheme>
                    <cbc:Name>${escapeXml(data.sender.taxOffice || '')}</cbc:Name>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
        </cac:Party>
    </cac:AccountingSupplierParty>

    ${(() => {
            const isTckn = data.receiver.vkn.length === 11;
            const nameParts = data.receiver.name.trim().split(/\s+/);
            const firstName = nameParts.slice(0, -1).join(" ") || nameParts[0] || "";
            const familyName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : " ";

            return `<cac:AccountingCustomerParty>
        <cac:Party>
            <cbc:EndpointID schemeID="pk">${escapeXml(data.receiver.alias || '')}</cbc:EndpointID>
            <cac:PartyIdentification>
                <cbc:ID schemeID="${isTckn ? 'TCKN' : 'VKN'}">${data.receiver.vkn}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name>${escapeXml(data.receiver.name)}</cbc:Name>
            </cac:PartyName>
            <cac:PostalAddress>
                <cbc:StreetName>${escapeXml(data.receiver.address || "Merkez")}</cbc:StreetName>
                <cbc:CitySubdivisionName>${escapeXml(data.receiver.district || "")}</cbc:CitySubdivisionName>
                <cbc:CityName>${escapeXml(data.receiver.city) || 'İSTANBUL'}</cbc:CityName>
                <cac:Country>
                    <cbc:IdentificationCode>TR</cbc:IdentificationCode>
                    <cbc:Name>Türkiye</cbc:Name>
                </cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cac:TaxScheme>
                    <cbc:Name>${escapeXml(data.receiver.taxOffice || '')}</cbc:Name>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
            <cac:Contact>
                <cbc:Telephone>${escapeXml(data.receiver.phone || '')}</cbc:Telephone>
                <cbc:ElectronicMail>${escapeXml(data.receiver.email || '')}</cbc:ElectronicMail>
            </cac:Contact>${isTckn ? `
            <cac:Person>
                <cbc:FirstName>${escapeXml(firstName.toUpperCase())}</cbc:FirstName>
                <cbc:FamilyName>${escapeXml(familyName.toUpperCase())}</cbc:FamilyName>
            </cac:Person>` : ''}
        </cac:Party>
    </cac:AccountingCustomerParty>`;
        })()}

    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${data.currency}">${taxTotal.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="${data.currency}">${subtotal.toFixed(2)}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="${data.currency}">${taxTotal.toFixed(2)}</cbc:TaxAmount>
            <cac:TaxCategory>
                <cac:TaxScheme>
                    <cbc:Name>KDV</cbc:Name>
                    <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>

    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="${data.currency}">${subtotal.toFixed(2)}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="${data.currency}">${subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="${data.currency}">${grandTotal.toFixed(2)}</cbc:TaxInclusiveAmount>
        <cbc:AllowanceTotalAmount currencyID="${data.currency}">0.00</cbc:AllowanceTotalAmount>
        <cbc:PayableAmount currencyID="${data.currency}">${grandTotal.toFixed(2)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>

    ${data.items.map((item, index) => `
    <cac:InvoiceLine>
        <cbc:ID>${index + 1}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="${item.unitCode || 'C62'}">${item.quantity}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="${data.currency}">${(item.quantity * item.unitPrice).toFixed(2)}</cbc:LineExtensionAmount>
        <cac:TaxTotal>
            <cbc:TaxAmount currencyID="${data.currency}">${(item.quantity * item.unitPrice * (item.vatRate / 100)).toFixed(2)}</cbc:TaxAmount>
            <cac:TaxSubtotal>
                <cbc:TaxableAmount currencyID="${data.currency}">${(item.quantity * item.unitPrice).toFixed(2)}</cbc:TaxableAmount>
                <cbc:TaxAmount currencyID="${data.currency}">${(item.quantity * item.unitPrice * (item.vatRate / 100)).toFixed(2)}</cbc:TaxAmount>
                <cbc:Percent>${item.vatRate}</cbc:Percent>
                <cac:TaxCategory>
                    <cac:TaxScheme>
                        <cbc:Name>KDV</cbc:Name>
                        <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
                    </cac:TaxScheme>
                </cac:TaxCategory>
            </cac:TaxSubtotal>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Name>${escapeXml(item.name)}</cbc:Name>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="${data.currency}">${item.unitPrice.toFixed(2)}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>
    `).join('')}
</Invoice>`;

    return xml;
}
