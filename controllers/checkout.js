const Address = require("../models/address");
const PaymentMethod = require("../models/paymentMethod");

function validationMessage(err) {
    const first = Object.values(err.errors)[0];
    return first ? first.message : "Geçersiz veri.";
}

exports.getAddresses = async (req, res, next) => {
    try {
        const addresses = await Address.find({ userId: req.user._id })
            .sort({ isDefault: -1, createdAt: -1 })
            .lean();
        res.json({ addresses });
    } catch (err) {
        next(err);
    }
}

exports.postAddress = async (req, res, next) => {
    try {
        const { title, fullName, phone, city, district, addressLine, postalCode, isDefault } = req.body;

        if (isDefault) {
            await Address.updateMany({ userId: req.user._id }, { $set: { isDefault: false } });
        }

        const address = new Address({
            userId: req.user._id,
            title,
            fullName,
            phone,
            city,
            district,
            addressLine,
            postalCode,
            isDefault: !!isDefault
        });
        await address.save();
        res.status(201).json({ address });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: validationMessage(err) });
        }
        next(err);
    }
}

exports.deleteAddress = async (req, res, next) => {
    try {
        const result = await Address.deleteOne({ _id: req.params.addressid, userId: req.user._id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Adres bulunamadı." });
        }
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
}

exports.getPaymentMethods = async (req, res, next) => {
    try {
        const paymentMethods = await PaymentMethod.find({ userId: req.user._id })
            .sort({ isDefault: -1, createdAt: -1 })
            .lean();
        res.json({ paymentMethods });
    } catch (err) {
        next(err);
    }
}

exports.postPaymentMethod = async (req, res, next) => {
    try {
        const { cardHolderName, cardNumber, brand, expiryMonth, expiryYear, isDefault } = req.body;

        // Only the last 4 digits are ever kept — the full number arrives
        // here transiently (this is a mock checkout, never a real payment
        // gateway) and is discarded once last4 is extracted.
        const digitsOnly = typeof cardNumber === "string" ? cardNumber.replace(/\D/g, "") : "";
        if (digitsOnly.length < 12) {
            return res.status(400).json({ error: "Geçerli bir kart numarası giriniz." });
        }
        const last4 = digitsOnly.slice(-4);

        if (isDefault) {
            await PaymentMethod.updateMany({ userId: req.user._id }, { $set: { isDefault: false } });
        }

        const paymentMethod = new PaymentMethod({
            userId: req.user._id,
            cardHolderName,
            last4,
            brand,
            expiryMonth: Number(expiryMonth),
            expiryYear: Number(expiryYear),
            isDefault: !!isDefault
        });
        await paymentMethod.save();
        res.status(201).json({ paymentMethod });
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: validationMessage(err) });
        }
        next(err);
    }
}

exports.deletePaymentMethod = async (req, res, next) => {
    try {
        const result = await PaymentMethod.deleteOne({ _id: req.params.paymentmethodid, userId: req.user._id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Kart bulunamadı." });
        }
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
}
