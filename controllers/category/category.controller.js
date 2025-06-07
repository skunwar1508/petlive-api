const category = require('../../models/category.model');
const roles = require('../../utils/roles');

const categoryController = {
    async getAll(req, res) {
        try {
            // If user is patient or doctor, filter by status: true
            let filter = {};
            if (
                req.doc &&
                (req.doc.role === roles.patient || req.doc.role === roles.doctor)
            ) {
                filter.status = true;
            }
            const categories = await category.find(filter);
            res.status(200).json(categories);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    async getOne(req, res) {
        try {
            let filter = { _id: req.params.id };
            if (
                req.doc &&
                (req.doc.role === roles.patient || req.doc.role === roles.doctor)
            ) {
                filter.status = true;
            }
            const cat = await category.findOne(filter);
            if (!cat) return res.status(404).json({ message: 'Category not found' });
            res.status(200).json(cat);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    async create(req, res) {
        if (!req.doc || req.doc.role !== roles.admin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        try {
            const newCategory = new category(req.body);
            const savedCategory = await newCategory.save();
            res.status(201).json(savedCategory);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    },

    async update(req, res) {
        if (!req.doc || req.doc.role !== roles.admin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        try {
            const updatedCategory = await category.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            if (!updatedCategory) return res.status(404).json({ message: 'Category not found' });
            res.status(200).json(updatedCategory);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    },

    async delete(req, res) {
        if (!req.doc || req.doc.role !== roles.admin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        try {
            const deletedCategory = await category.findByIdAndDelete(req.params.id);
            if (!deletedCategory) return res.status(404).json({ message: 'Category not found' });
            res.status(200).json({ message: 'Category deleted successfully' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
};

module.exports = categoryController;