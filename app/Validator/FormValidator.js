'use strict'
/**
@Author: Nur
Class to validate form input with known schema
*/

const FormValidationException = use('App/Exceptions/FormValidationException')

class FieldValidator {
  constructor (form) {
    this.form = form
  }

  // abstract
  validate (answers) {
    throw new FormValidationException('Unhandled field ' + this.form.name)
  }

  checkIfFieldExists (answers) {
    if (answers[this.form.name] === undefined) {
      throw new FormValidationException('Field not found in answer : ' + this.form.name)
    }
  }
}

class SingleOptionValidator extends FieldValidator {
  constructor (form) { super(form) }

  validate (answers) {
    super.checkIfFieldExists(answers)
    const expected_values = this.form.data.map(function (v) { return v.value })
    if (!expected_values.includes(answers[this.form.name])) {
      throw new FormValidationException('Value ' + answers[this.form.name] + ' not an option for ' + this.form.name)
    }

    return { [this.form.name]: answers[this.form.name] }
  }
}

class TextValidator extends FieldValidator {
  constructor (form) { super(form) }

  validate (answers) {
    super.checkIfFieldExists(answers)
    if (!(typeof answers[this.form.name] === 'string')) {
      throw new FormValidationException('Expecting string object for key ' + this.form.name)
    }

    return { [this.form.name]: answers[this.form.name] }
  }
}

class NumberValidator extends FieldValidator {
  constructor (form) { super(form) }

  validate (answers) {
    super.checkIfFieldExists(answers)
    if (!(typeof answers[this.form.name] === 'number')) {
      throw new FormValidationException('Expecting number object for key ' + this.form.name)
    }

    return { [this.form.name]: answers[this.form.name] }
  }
}

class ScaleValidator extends NumberValidator {
  constructor (form) { super(form) }

  validate (answers) {
    const answer = super.validate(answers)[this.form.name]
    const min = this.form.data[0].min
    const max = this.form.data[0].max
    if ((min > answer) || (max < answer)) {
      throw new FormValidationException('Answer ' + this.form.name + ' must be between ' + min + ' and ' + max)
    }

    return { [this.form.name]: answer }
  }
}

class CheckboxValidator extends FieldValidator {
  constructor (form) { super(form) }

  validate (answers) {
    super.checkIfFieldExists(answers)
    const answer = answers[this.form.name]
    const expected_values = this.form.data.map(function (v) { return v.value })
    if (!(Array.isArray(answer))) {
      throw new FormValidationException('Expecting array object for key ' + this.form.name)
    }

    for (let i = 0; i < answer.length; i++) {
      if (!(expected_values.includes(answer[i]))) {
        throw new FormValidationException('Value ' + answer[i] + ' not an option for ' + this.form.name)
      }
    }

    return { [this.form.name]: answer }
  }
}

class DropdownValidator extends SingleOptionValidator {
  constructor (form) { super(form) }
  validate (answers) { return super.validate(answers) }
}

class RadioValidator extends SingleOptionValidator {
  constructor (form) { super(form) }
  validate (answers) { return super.validate(answers) }
}

class FormValidator {
  /*
	Return true, sanitized if answer conforms
	else, return false
	*/
  static validate (form, answers) {
    const validators = form.map(function (element) {
      return ValidatorFactory.generateValidator(element)
    })

    // map provide sanitizing semantic (throwing unused form keys)
    // while validate provides validation
    const sanitized_data = validators.map(function (validator) {
      return validator.validate(answers)
    })

    /** transform to key=>val */

    const result = {}
    sanitized_data.forEach((element, index, array) => {
      for (const [key, value] of Object.entries(element)) { result[key] = value }
    })

    return result
  }
}

class ValidatorFactory {
  static generateValidator (form) {
    switch (form.type) {
      case 'text' :
        return new TextValidator(form)

      case 'number' :
        return new NumberValidator(form)

      case 'scale' :
        return new ScaleValidator(form)

      case 'option' :
        return new CheckboxValidator(form)

      case 'dropdown' :
        return new DropdownValidator(form)

      case 'radio' :
        return new RadioValidator(form)

      default :
        throw new FormValidationException('Unknown form type')
    }
  }
}

module.exports = FormValidator
