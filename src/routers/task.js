const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = express.Router()

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, author: req.user._id })

        if(!task) {
            return res.status(400).send()
        }

        res.send(task)
    } catch(e) {
        res.status(400).send(e)
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const reqFields = Object.keys(req.body)
    const allowedFields = ['description', 'completed']
    const isValidFields = reqFields.every((key) => allowedFields.includes(key))

    if(!isValidFields) {
        return res.status(400).send({ error: 'Invalid fields' })
    }
    try {
        const task = await Task.findOne({ _id: req.params.id, author: req.user._id })

        if(!task) {
            return res.status(400).send()
        }

        reqFields.forEach((key) => task[key] = req.body[key])
        await task.save()

        res.send(task)
    } catch(e) {
        res.status(400).send(e)
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
       const task = await Task.findOne({ _id, author: req.user._id })

       if(!task) {
            return res.status(404).send()
        }

        res.send(task)
    } catch(e) {
        res.status(500).send()
    }
})

// GET /tasks/completed?true
// GET /tasks/limit=10&skip=20
// GET /tasks/sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }
    
    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch(e) {
        res.status(500).send()
    }
})

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        author: req.user._id
    })

    try {
       await task.save()
       res.status(201).send(task)
    } catch(e) {
        res.status(400).send(e)
    }
})

module.exports = router