const User = require('../models/User');
const Note = require('../models/Note');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

const getAllNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find().lean();
  if (!notes?.length) {
    return res.status(400).json({ message: 'No notes found' });
  }
  const notesWithUser = await Promise.all(
    notes.map(async (note) => {
      const user = await User.findById(note.user).lean().exec();
      return { ...note, username: user.username };
    })
  );

  res.json(notesWithUser);
});

const createNewNote = asyncHandler(async (req, res) => {
  const { user, title, text } = req.body;
  // confirm data
  if (!user || !title || !text) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  // check duplicate
  const duplicate = await Note.findOne({ title })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec();
  if (duplicate) {
    return res.status(400).json({ message: 'Duplicate note title' });
  }

  const note = await Note.create({ user, title, text });

  if (note) {
    res.status(201).json({ message: `New note created` });
  } else {
    res.status(400).json({ message: 'Invalid note data received' });
  }
});

const updateNote = asyncHandler(async (req, res) => {
  const { id, user, title, text, completed } = req.body;
  // confirm data
  if (!id || !user || !title || !text || typeof completed !== 'boolean') {
    return res.status(400).json({ message: 'All fields are required' });
  }
  // confirm note exist to update
  const note = await Note.findById(id).exec();
  if (!note) {
    res.status(400).json({ message: 'Note not found' });
  }
  // check duplicate
  const duplicate = await Note.findOne({ title })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec();

  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(400).json({ message: 'Duplicate note title' });
  }

  note.user = user;
  note.title = title;
  note.text = text;
  note.completed = completed;

  const updatedNote = await note.save();

  res.json({ message: `${updatedNote.title} updated` });
});
const deleteNote = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    res.status(400).json({ message: 'User id required' });
  }

  const note = await Note.findById(id).exec();

  if (!note) {
    res.status(400).json({ message: 'Note not found' });
  }

  const result = await note.deleteOne();
  const reply = `Note ${result.title} with ID ${result._id} is deleted`;

  res.json(reply);
});

module.exports = { getAllNotes, createNewNote, updateNote, deleteNote };
