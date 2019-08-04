class Person{
    getName(){
        return "name";
    }
}

class Student extends Person{
    getClass(){
        return "class1";
    }
}

module.exports = {
    Person, Student
}
