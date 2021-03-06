import React from 'react';
import firebase from "firebase/app";
import "firebase/database";
import "firebase/auth";
import "./AssignText.css";
import EditText from "./EditText";
import { BsPeopleCircle, BsArrowLeft, BsChevronRight } from "react-icons/bs";
import { Accordion, Card, ListGroup } from "react-bootstrap"
import { GoPlus } from "react-icons/go";
import { Table } from "react-bootstrap"


class AssignText extends React.Component {
    constructor(props) {
        super(props);
        this.renderTextRows = this.renderTextRows.bind(this);
        this.renderTextTable = this.renderTextTable.bind(this);
        this.renderStudentTable = this.renderStudentTable.bind(this);
        this.getTexts = this.getTexts.bind(this);
        this.renderStudents = this.renderStudents.bind(this);
        this.selectText = this.selectText.bind(this);
        this.handleAssign = this.handleAssign.bind(this);
        this.editText = this.editText.bind(this);
        this.backToAssign = this.backToAssign.bind(this);
        this.state = {
            texts: [],
            selectedTextId: null,
            classrooms:[],
            retrievedTexts: false,
            isEditingText:false
        }
    }

    componentDidMount() {
        this.getTexts();
        this.getClassrooms();
    }

    getTexts(){
        var defaultTextId;
        var index = 0;
        let ref = firebase.database().ref("teachers/" + this.props.uid + "/texts");
        var textArr = [];
        ref.once('value').then(snapshot => {
            if(snapshot.exists()) {
                snapshot.forEach((child) => {
                    //find text in text table
                    if (index===0){defaultTextId = child.key;index++}
                    firebase.database().ref("texts/" + child.key).once('value').then(snapshot =>{
                        if(snapshot.exists()){
                            textArr.push(snapshot.val())
                            this.setState({retrievedTexts: true});
                        }
                    });
                });
                
                this.setState({
                    texts: textArr,
                    selectedTextId: defaultTextId
                });
            }
        });
    }

    getClassrooms() {
        let ref = firebase.database().ref("teachers/" + this.props.uid + "/classrooms");
        ref.once('value').then(snapshot => {
            if(snapshot.exists()) {
                snapshot.forEach((child) => {
                    this.state.classrooms.push(child.val());
                });
            }
        });
    }

    renderStudentTable() {
        return (
            <Table id="students-table-container" bordered>
            <thead>
                <tr>
                    <th>Students</th>
                </tr>
            </thead>
            <Accordion id="students-Accordian" defaultActiveKey="0">
                
               {Object.values(this.state.classrooms).map((classroom, index) => {
                return (
                    <Card key={classroom.code}>
                        <Accordion.Toggle id="students-accordian" eventKey={""+index}>
                            {classroom.name}
                        </Accordion.Toggle>     
                        <Accordion.Collapse eventKey={""+index}>
                            <ListGroup variant="flush">
                                {this.renderStudents(index)}
                            </ListGroup>
                        </Accordion.Collapse>
                    </Card>
                    );
                })}
            </Accordion>  
            </Table>      
            );
    }
        

    renderStudents(i) {
        const classroom = Object.values(this.state.classrooms)[i];
        return classroom.students ? (
                Object.values(classroom.students).map((student, j) => {
                    return (
                        <ListGroup.Item id="students-listGroup"  key={"student-" + j}>
                            <BsPeopleCircle />
                            {student.name}
                            <input type="checkbox" className= "checkbox-btn" value={student.uid} name="name" id={"cb-btn-"+i+"-"+j} onClick = {() => {this.handleAssign(student.uid,i,j)}}/>
                        </ListGroup.Item>
                    )
                })
         ) : ( 
            <span><strong>No students yet</strong></span>
          );
    }

    renderTextTable() {
         const texts = this.state.texts;
            return (
                <Table id="texts-table-container" bordered>
                    <thead>
                        <tr>
                            <th>Texts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.retrievedTexts? this.renderTextRows() : <span><strong>No texts yet</strong></span>}
                    </tbody>
                    <tfoot>
                        <tr tabIndex="0" data-index={texts.length} key={"create-new-text"} id="add-row">  
                            <td onClick= {() => {this.props.addText()}}>Create New Text {<GoPlus id="add-text-btn"/>}</td>
                        </tr>
                    </tfoot>
                </Table>
            )
    }

    renderTextRows(){
        const texts = this.state.texts;
         return texts.map((text, index) => {
            return (  
            <tr id={"text-"+index} tabIndex="0" data-index={index} key={"text-"+index} onClick={()=> this.selectText(index)}>
                <td>
                    {text.title} 
                    <button className="edit-link-btn" onClick={() => {this.editText()}}>EDIT</button>
                    <BsChevronRight />
                </td>
            </tr>
            );
        });
    }

    selectText(index){
        const text = this.state.texts[index].textId;
        this.setState({ selectedTextId: text});
        this.toggleTableColor(index);
    }

    toggleTableColor(index) {
        // change the selected row to gray
        var currentRow = document.getElementById("text-" + index);
        currentRow.style.backgroundColor = "#9DA6A9";
        currentRow.style.color = "white";
        // get all its siblings (other rows in table)
        const parent = currentRow.parentNode;
        const siblings = [].slice.call(parent.children).filter(function(child) {
            return child !== currentRow;
        });
        // change them all to light blue
        siblings.forEach(sibling => {
            sibling.style.backgroundColor = "#cfd8dc";
            sibling.style.color = "#7b8d93";
        });
    }

    //updates the checkmarks
    updateStudentTable(text){
        const cbs = document.querySelectorAll('input[type="checkbox"]');
        if (cbs!=null){
            var i;
            for (i = 0; i < cbs.length; ++i) {
                const box = cbs[i];
                const studentId = box.value;
                let ref = firebase.database().ref("students/" + studentId);
                ref.once('value').then(snapshot => {
                    if(snapshot.exists()) {
                        
                        var student = snapshot.val();
                        if (student.texts!=null && student.texts.hasOwnProperty(text)){
                            box.checked = true;
                        }
                        else{
                            box.checked = false;
                        }
                    }
                });
            }
        }
    }


    handleAssign(student, i, j){        
        const checked = document.getElementById("cb-btn-"+i+"-"+j).checked;
        var ref = firebase.database().ref('students/' + student + '/texts/' + this.state.selectedTextId);
        if (checked){
            ref.set({
                textId: this.state.selectedTextId,
                timesRead: 0,
            });
        }
        else{
            ref.remove();
        }
    }

    editText(){
        this.setState({isEditingText:true});
    }

    backToAssign(){
        this.setState({isEditingText:false}, function () {
            this.updateStudentTable(this.state.texts[0].textId);
        });          
    }

    render() {
        if(this.state.isEditingText){
            return <EditText uid={this.props.uid} getTexts={this.getTexts} goBack={this.backToAssign} textId={this.state.selectedTextId}/>;
        }
        else{
            return (
                <div id="homepage-container" className="container-fluid">
                    <h1><strong>Assign Texts</strong></h1>
                    <div id="back-arrow" type="button" role="button" tabIndex="0" onClick={this.props.showDashboard}>
                        <BsArrowLeft />
                    </div>
                    {this.renderTextTable()}
                    {this.state.retrievedTexts && this.renderStudentTable()} 
                    {this.updateStudentTable(this.state.selectedTextId)}
                </div>
                
            );
        }
    }
}

export default AssignText;