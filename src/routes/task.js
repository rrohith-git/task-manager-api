const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = express.Router()

router.post('/tasks', auth, async (req, res) => {
  try {
    const task = new Task({
      ...req.body,
      owner: req.user._id
    })
    const createdTask = await task.save()
    res.status(201).send(createdTask)
  } catch (err) {
    res.status(400).send(err)
  }
})

router.get('/tasks', auth, async (req, res) => {
  try {
    const match = {}
    if (req.query.completed) {
      match.completed = req.query.completed.toLowerCase() === 'true'
    }
    const sort = {}
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':')
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }
    // using the Task model
    // const tasks = await Task.find({ owner: req.user._id })
    // res.send(tasks)
    // using the User model
    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    })
    res.send(req.user.tasks)
  } catch (err) {
    res.status(500).send()
  }
})

router.get('/tasks/:id', auth, async (req, res) => {
  try {
    const { id: _id } = req.params
    const task = await Task.findOne({ _id, owner: req.user._id })
    if (!task) {
      return res.status(404).send()
    }
    res.send(task)
  } catch (err) {
    res.status(500).send()
  }
})

router.patch('/tasks/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body)
  const allowUpdates = ['description', 'completed']
  const isValidOperation = updates.length > 0 ? updates.every(update => allowUpdates.includes(update)) : false
  if (!isValidOperation) {
    return res.status(400).send({
      error: 'Invalid Operation!'
    })
  }
  try {
    const { id: _id } = req.params
    // const updatedTask = await Task.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
    const task = await Task.findOne({ _id, owner: req.user._id })
    if (!task) {
      return res.status(400).send()
    }
    updates.forEach((update) => { task[update] = req.body[update] })
    await task.save()
    res.send(task)
  } catch (err) {
    res.status(500).send()
  }
})

router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const { id: _id } = req.params
    const deletedTask = await Task.findOneAndDelete({ _id, ownwer: req.user._id })
    if (!deletedTask) {
      return res.status(404).send()
    }
    res.send(deletedTask)
  } catch (err) {
    res.status(500).send()
  }
})

module.exports = router
