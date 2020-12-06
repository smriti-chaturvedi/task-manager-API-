const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')

const router = new express.Router()

//Create Task
router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    try {
        await task.save()
        res.status(201).send(task)
    }catch(e) {
        res.status(400).send(e)
    }
})

//Read Tasks 
//FILTER => /GET tasks?completed=true/false
//PAGINATION => /GET tasks?limit=2&skip=2
//SORTING => /GET tasks?sortBy=createdAt:asc/desc OR tasks?sortBy=completed:asc/desc  (1->ascending/false, -1->descending/true)
router.get('/tasks', auth, async (req, res) => {
    try {
        const match = {}
        if(req.query.completed) {
            match.completed = req.query.completed === 'true' 
        }
        const sort = {}
        if(req.query.sortBy) {
            const parts = req.query.sortBy.split(':')
            sort[parts[0]] = parts[1] === 'asc' ? 1 : -1 
        }

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
    }catch(e) {
        res.status(500).send(e)
    } 
})

//Read Task by ID
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try {
        const task = await Task.findOne({_id, owner: req.user._id})
        if(!task) {
            return res.status(404).send()
        }
        res.send(task)
    }catch(e) {
        res.status(500).send(e)
    }
})

//Update Task
router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ["description", "completed"]
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidOperation) {
        return res.status(404).send({Error: "Invalid Operation!"})
    }

    try {
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id}) 
        if(!task) {
            return res.status(404).send()
        }
        updates.forEach((update) => task[update] = req.body[update])
        await task.save()
        res.send(task)
    }catch(e) {
        res.status(400).send(e)
    }
})

//Delete Task
router.delete('/tasks/:id', auth, async (req, res) => {
    try{
        // const task = await Task.findByIdAndDelete(req.params.id)
        const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    }catch(e){
        res.status(500).send(e)
    }
})


module.exports = router