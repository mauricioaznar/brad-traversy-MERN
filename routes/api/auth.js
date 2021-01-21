const express = require('express')
const router = express.Router()
const bcryptjs = require('bcryptjs')
const auth = require('../../middleware/auth')
const User = require('../../models/User')
const {body, validationResult} = require('express-validator')
const jwt = require('jsonwebtoken')
const config = require('config')

// @route GET api/users
// @desc Test route
// @access Public
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    res.json(user)
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server error')
  }
})

// @route POST api/users
// @desc Test route
// @access Public

router.post('/',
  [body('email', 'Please include a vaild email').isEmail(),
  body('password', 'Password is required').exists()],
  async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const {email, password} = req.body
      const user = await User.findOne({email})

      if (!user) {
        return res.status(400).json({ errors: [{msg: 'Invalid credentials'}]})
      }

      const isMatch = await bcryptjs.compare(password, user.password)

      if (!isMatch) {
        return res.status(400).json({ errors: [{msg: 'Invalid credentials'}]})
      }

      const payload = {
        user: {
          id: user.id
        }
      }

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        {expiresIn: 360000}, (err, token) => {
          if (err) throw err
          return res.json({
            token
          })
        }
      )

    } catch (err){
      console.log(err.message)
      res.status(500).send('Server error')
    }
  }
)

module.exports = router