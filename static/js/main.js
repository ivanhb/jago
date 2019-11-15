// CONST variables
var graph_container = "cy";
var graph_panel_container = "cy_panel";
var model_url = "https://ivanhb.github.io/edu/model/";

var graph_conf = {
  "nodes": [
    {"group":"007", "class":"Code"},
    {"group":"005", "class":"Publication"},
    {"group":"001", "class":"Activity"},
    {"group":"004", "class":"Organization"},
    {"group":"002", "class":"Project"},
    {"group":"003", "class":"Demo"},
    {"group":"003", "class":"Presentation"}
    //{"group":"6", "class":"Report"}
  ],
  "attributes":{
    "Publication":["nickname","reference","reference_format","author","date","persistent_id","persistent_id_type","@hasKeyword"],
    "Code":["nickname","title","subtitle","date","persistent_id","persistent_id_type","source","@hasKeyword"],
    "Activity":["nickname","title","subtitle","date","description","contribution","location","webpage","start_date","end_date","@hasKeyword"],
    "Organization":["nickname","name","description","personal_webpage","logo","webpage","start_date","end_date","@hasKeyword","@hasMember"],
    "Project":["nickname","name","description","personal_webpage","logo","webpage","start_date","end_date","@hasKeyword","@hasMember"],
    "Demo":["nickname","source","title","subtitle","persistent_id","persistent_id_type","date","@hasKeyword"],
    "Presentation":["nickname","source","title","subtitle","persistent_id","persistent_id_type","date","@hasKeyword"],
    "Member": ["role","@hasPerson"],
    "Person":["nickname","name","position","affiliation","webpage"],
    "Keyword": ["value"],
    "Report": ["source","date","@hasKeyword"]
  },
  "edges": [
    "@hasWork",
    "@hasIllustration",
    "@hasProduct",
    "@hasOrganization"
  ]
}
var graph_style = {
    "group": {
      "001": {
        'shape': 'diamond',
        'font-size': '13pt',
        'width': '35',
        'height': '35',
        'background-color': '#ee7a22',
        'label': 'data(attribute.nickname)'
      },
      "002": {
        'shape': 'pentagon',
        'font-size': '16pt',
        'width': '50',
        'height': '50',
        'background-color': '#2296EE',
        'label': 'data(attribute.nickname)'
      },
      "003": {
        'shape': 'diamond',
        'font-size': '11pt',
        'width': '20',
        'height': '20',
        'background-color': '#CE1271',
        'label': 'data(attribute.nickname)'
      },
      "005": {
        'font-size': '11pt',
        'width': '20',
        'height': '20',
        'background-color': '#F4D03F',
        'label': 'data(attribute.nickname)'
      },
      "004": {
        'shape': 'pentagon',
        'font-size': '16pt',
        'width': '80',
        'height': '80',
        'background-color': '#2F8A60',
        'label': 'data(attribute.nickname)'
      },
      "007": {
        'shape': 'diamond',
        'font-size': '11pt',
        'width': '20',
        'height': '20',
        'background-color': '#9E4FC5',
        'label': 'data(attribute.nickname)'
      }
    }
}

/*
The availiable filters are:
"classes": check while processing the nodes
"keywords": check while processing the nodes

Note: Comment the filters you dont want in the interface
*/
var graph_filter = {
  "classes":["Code","Publication","Activity","Organization","Project","Demo","Presentation"],
  "report": {class: "Report", bounding_att:"@hasKeyword", value:1, label:"Report: "},
  "keywords": {type:"class", value: "Keyword", attribute:"value", items:[]}
};

var graph_info_box = {
  nodes:{
    "Code": {"title":[],"source":[is_link],"@hasKeyword":null},
    "Publication": {"reference":[],"persistent_id":[is_link],"@hasKeyword":null},
    "Activity": {"start_date":[],"end_date":[is_end_date],"location":[],"title":[],"subtitle":[],"contribution":[is_contribution],"@hasKeyword":null,"webpage":[is_webpage]},
    "Organization": {"start_date":[],"end_date":[is_end_date],"name":[],"description":[],"personal_webpage":[],"@hasMember":null,"@hasKeyword":null,"webpage":[is_webpage]},
    "Project": {"start_date":[],"end_date":[is_end_date],"name":[],"description":[],"personal_webpage":[is_personal_webpage],"@hasMember":null,"@hasKeyword":null,"webpage":[is_webpage]},
    "Demo": {"title":[],"source":[is_link],"@hasKeyword":null},
    "Presentation": {"title":[],"source":[is_link],"@hasKeyword":null},
    "Keyword": {"value":[]},
    "Member": {"@hasPerson":null},
    "Person":{"nickname":[]},
    "Report":{"source":[]}
  }
}

function is_link(a_str) {
  return "<a href='"+a_str+"'>"+a_str+"</a>";
}
function is_webpage(a_str) {
  return "<a href='"+a_str+"'>Visit the website -></a>";
}
function is_personal_webpage(a_str) {
  return "<a href='"+a_str+"'>"+a_str+"</a>";
}
function is_end_date(a_str) {
  return " - "+a_str;
}
function is_contribution(a_str) {
  return "<span style='font-weight: bold;'>Contribution: </span>"+a_str;
}

// A local copy of the file: model_url+"index.json"
var model_index = null;

// an index of all the classes inside the model index
var class_index = null;

// the aditional data of all the other classes which are not nodes inside the graph
var class_data_non_nodes = {};

// the definition of the cy_graph
// this variable will be the input of cytoscape() to define the cy graph, after the end of definition process
var cy_graph_def = {};

// an index of all the elements in the cy_graph_def
var cy_graph_index = null;

// The CY GRAPH object
var cy_graph = null;

$.ajax({
        type: "GET",
        url: model_url+"index.json",
        dataType: "json",
        async: true,
        success: function(data) {
          model_index = data;
          build_graph();
        }
});

//init the cy graph and all its related variables
//this should be called before defining the Graph and each time a filter is applyied
function init(){
  //init containers
  document.getElementById(graph_container).innerHTML = "";
  document.getElementById(graph_panel_container).innerHTML = "";

  cy_graph_def["container"] = document.getElementById('cy');
  cy_graph_def["elements"] = {"nodes":[],"edges":[]};
  cy_graph_def["style"] = [];
  cy_graph_def["layout"] = {name: 'cola'};

  class_index = {};
  cy_graph_index = {"nodes":{},"edges":{}};
}

function def_class(class_name){

  var class_file = "";
  var class_tree = [];
  var class_edges = {};
  var class_attribute = {};

  var init_class_name = class_name;
  do {
    class_tree.push(init_class_name);
    data_class_obj = model_index["class"][init_class_name];
    //add the relations which are edges and attributes
    class_attribute = Object.assign({}, class_attribute, data_class_obj.attribute);
    class_edges = Object.assign({}, class_edges, data_class_obj.relation);
    init_class_name = data_class_obj["@isSubclassOf"];
  } while (init_class_name != undefined);

  for (var i = 1; i < class_tree.length; i++) {
    class_file = class_tree[i].toLowerCase() + "/" + class_file;
  }
  class_file = class_file + class_name.toLowerCase()+".json";

  return {
    "items": [],
    "tree": class_tree,
    "attribute": class_attribute,
    "edges": class_edges,
    "file": "src/"+class_file,
    "prefix": data_class_obj["prefix"]
  }
}

var pending = {
  nodes: {},
  non_nodes: {}
}

function build_graph() {

  // init all the graph elements
  init();

  // Define the processing index
  for (var a_class in model_index["class"]) {
    var a_class_def = def_class(a_class, model_index);
    class_index[a_class] = a_class_def;
  }

  //Define all the non-nodes classes
  var other_classes = [];
  for (var a_class in graph_conf.attributes) {
    var is_node = false;
    for (var i = 0; i < graph_conf.nodes.length; i++) {
      is_node = is_node || (graph_conf.nodes[i].class == a_class);
    }
    if (!(is_node)) {
      pending.non_nodes[a_class] = false;
      other_classes.push(a_class);
    }
  }

  //define the pending for nodes
  for (var i = 0; i < graph_conf["nodes"].length; i++) {
    var class_name = graph_conf["nodes"][i]["class"];
    pending.nodes[class_name] = false;
  }


  for (var i = 0; i < graph_conf["nodes"].length; i++) {
    process_nodes(i);
  }
  for (var i = 0; i < other_classes.length; i++) {
    process_a_non_node(i);
  }

  function process_nodes(index){
    var class_name = graph_conf["nodes"][index]["class"];

    //get from index all the vars of this Class
    var a_class_def = class_index[class_name];
    $.ajax({
            type: "GET",
            url: model_url+a_class_def.file,
            dataType: "json",
            async: true,
            error: function(xhr) {
              //Do Something to handle error
              //pending.nodes[class_name] = true;
            },
            success: function(a_class_file_data) {
              if (_node_respect_filters(class_name)) {
                  if ("items" in a_class_file_data) {

                          var a_class_filtered_items = [];
                          for (var i_item = 0; i_item < a_class_file_data.items.length; i_item++) {
                            if (_node_respect_filters(class_name, a_class_file_data.items[i_item])) {
                              a_class_filtered_items.push(a_class_file_data.items[i_item]);
                            }
                          }

                          class_index[class_name]["items"] = a_class_filtered_items;

                          def_elems(class_name, a_class_def, {'items': a_class_filtered_items});

                          // ----------
                          // The style of the Element
                          // ----------
                          var elem_style = {
                            selector: "node[item_class = '"+class_name+"']",
                            style: {}
                          };
                          var style_group = graph_conf["nodes"][index]["group"];
                          if (style_group in graph_style.group) {
                            elem_style.style = Object.assign({}, elem_style.style, graph_style.group[style_group]);
                          }
                          cy_graph_def["style"].push(elem_style);

                    }
                }
                pending.nodes[class_name] = true;
                process_edges();
            }
    });

    function _node_respect_filters(class_name, node_data = null){

      //classes filter
      if ("classes" in graph_filter) {
        if (graph_filter.classes.indexOf(class_name) == -1) {
          return false;
        }
      }

      if (("keywords" in graph_filter) && (node_data != null)) {
        var elem_to_check = null;

        var filter_prop = graph_filter.keywords.value;
        // if the type is a class then check the edges
        if (graph_filter.keywords.type == "class") {
          for (var a_k in class_index[class_name].edges) {
            if (class_index[class_name].edges[a_k] == filter_prop){
              //get its value from "relation"
              elem_to_check = node_data.relation[a_k];
            }
          }
        }else if (graph_filter.keywords.type == "attribute") {
          // if the type is an attribute then check the edges
          elem_to_check = node_data.attribute[filter_prop];
        }

        if ((graph_filter.keywords.items.length > 0) && (elem_to_check != null)){
          var intersect = elem_to_check.filter(value => -1 !== graph_filter.keywords.items.indexOf(value));
          if (intersect.length == 0) {
            return false;
          }
        }
      }


      return true;
    }
  }



  function process_a_non_node(index) {
    var class_name = other_classes[index];
    var a_class_def = class_index[class_name];
    $.ajax({
            type: "GET",
            url: model_url+a_class_def.file,
            dataType: "json",
            async: true,
            error: function(xhr) {
              //Do Something to handle error
              pending.nodes[class_name] = true;
            },
            success: function(a_class_file_data) {
              class_index[class_name]["items"] = a_class_file_data["items"];
              def_elems(class_name, a_class_def, a_class_file_data, is_node= false);
              pending.non_nodes[class_name] = true;
              process_edges();
            }
    });
  }

  function process_edges() {

    //when all pending calls are done
    if (are_no_pending_calls()){

          for (var class_name in class_index) {
            var a_class_def = class_index[class_name];

            // ----------
            // The Edges
            // ----------
            for (var i = 0; i < class_index[class_name]["items"].length; i++) {
                var _data_item = class_index[class_name]["items"][i];

                if ("relation" in _data_item) {
                  for (var relation_key in _data_item["relation"]) {

                        for (var k = 0; k < _data_item["relation"][relation_key].length; k++) {
                            var elem_edge = {"data":{}};
                            var source_id = a_class_def.prefix+"/"+_data_item["id"];
                            elem_edge.data["source"] = source_id;

                            var target_class = a_class_def.edges[relation_key];
                            var target_prefix = class_index[target_class].prefix;
                            var target_id = target_prefix+"/"+_data_item["relation"][relation_key][k];

                            //if both source and target nodes exist then this is an edge
                            if((source_id in cy_graph_index.nodes) && (target_id in cy_graph_index.nodes)){
                              if (relation_key in a_class_def.edges) {
                                elem_edge.data["target"] = target_id;
                                elem_edge.data["id"] = relation_key+":"+source_id+";"+target_id;
                                cy_graph_index.edges[elem_edge.data.id] = cy_graph_def["elements"].edges.length;
                                cy_graph_def["elements"].edges.push(elem_edge);
                              }
                            }
                            //if the source exist but not the target this might be an attribute
                            else{
                              if(source_id in cy_graph_index.nodes){
                                var corresponding_node = cy_graph_def["elements"].nodes[cy_graph_index.nodes[source_id]];
                                // is an attribute ?
                                if (relation_key in corresponding_node.data.attribute) {
                                  corresponding_node.data.attribute[relation_key].push(target_id);
                                }
                              }
                              // in this case is a non-node and we just need to update the target id with a prefix-target version
                              else if ((source_id in class_data_non_nodes) && (target_id in class_data_non_nodes)) {
                                class_data_non_nodes[source_id].attribute[relation_key].push(target_id);
                              }
                            }
                        }
                  }
                }
            }
          }

          //Assign reports in case we want it
          //in this case we add "report" to each node
          process_report();

          // Ready to build all
          cy_graph = cytoscape(cy_graph_def);
          build_panel();
          console.log(class_data_non_nodes);
          console.log(cy_graph_def);
          console.log(class_index);
          console.log(cy_graph_index);
          console.log(graph_filter);
      }

      function are_no_pending_calls(){
        var res = true;
        for (var a_class in pending.nodes) {
          res = res && pending.nodes[a_class];
        }
        for (var a_class in pending.non_nodes) {
          res = res && pending.non_nodes[a_class];
        }
        return res;
      }
  }

  function process_report(){
    if ("report" in graph_filter) {
      var report_class_def = class_index[graph_filter.report.class];
      var report_data = _get_report_data();
      report_data = report_data.slice(0, graph_filter.report.value);

      // get the common bounding variable
      var report_bounding_vals = {};
      for (var i_r = 0; i_r < report_data.length; i_r++) {
        report_bounding_vals[report_data[i_r].id] = report_data[i_r].attribute[graph_filter.report.bounding_att];
      }

      //iterate all nodes
      for (var i_n = 0; i_n < cy_graph_def["elements"].nodes.length; i_n++) {

        var corresponding_node = cy_graph_def["elements"].nodes[i_n];
        corresponding_node.data.attribute["@@Report"] = [];

        var border_width = 0;
        if (graph_filter.report.bounding_att in corresponding_node.data.attribute) {
          for (var k_repo in report_bounding_vals) {
            var intersect = false;
            var check_elems = corresponding_node.data.attribute[graph_filter.report.bounding_att];
            var intersect = report_bounding_vals[k_repo].filter(value => -1 !== check_elems.indexOf(value));
            if (intersect.length > 0) {
              corresponding_node.data.attribute["@@Report"].push(k_repo);
            }
          }
          border_width = corresponding_node.data.attribute["@@Report"].length * 3;
        }else {
          corresponding_node.data.attribute["@@Report"] = [];
        }

        /*style it too*/
        var elem_style = {
            selector: "node[id = '"+corresponding_node.data.id+"']",
            style: {
              'border-width': border_width,
              'border-color': '#E74B4B'
            }
        };
        cy_graph_def["style"].push(elem_style);
      }
    }

    function _get_report_data() {
      var res = [];
      var report_class_def = class_index[graph_filter.report.class];
      for (var k_id in class_data_non_nodes) {
        if(k_id.includes(report_class_def.prefix)){
          res.push(class_data_non_nodes[k_id]);
        }
      }

      /*sort array of objects according to date*/
      var sorted_res = res.sort(compare);
      function compare( a, b ) {
        var a_d_parts = convert_date(a.attribute.date);
        a = new Date(a_d_parts[0], a_d_parts[1], a_d_parts[2]);

        var b_d_parts = convert_date(b.attribute.date);
        b = new Date(b_d_parts[0], b_d_parts[1], b_d_parts[2]);

        if ( a < b ){
          return -1;
        }
        if ( a > b ){
          return 1;
        }
        return 0;
      }
      function convert_date(a) {
        var a_parts = a.split("/");
        var a_int_parts = ["1","0","2000"];
        var date_index = 2;
        for (var i_part = 0; i_part < a_parts.length; i_part++) {
          a_int_parts[date_index] = parseInt(a_parts[i_part]);
          date_index -= 1;
        }
        return a_int_parts;
      }

      return sorted_res;
    }
  }

  function def_elems(class_name, a_class_def, a_class_file_data, is_node = true){

          // ----------
          // The Elems
          // ----------
          for (var i = 0; i < a_class_file_data["items"].length; i++) {

                var _data_item = a_class_file_data["items"][i];
                var node_data = {
                    "id": a_class_def.prefix+"/"+_data_item["id"],
                    "item_class": class_name,
                    "attribute": {}
                }

                if (class_name in graph_conf["attributes"]) {
                    //add the attributes with absolute values
                    for (var att_key in _data_item["attribute"]) {
                      if (graph_conf["attributes"][class_name].indexOf(att_key) != -1) {
                        node_data["attribute"][att_key] = _data_item["attribute"][att_key];
                      }
                    }
                    //add the attributes which comes from relations as <ATT>:[]
                    //these will be populated after with the corresponding ids
                    for (var i_att = 0; i_att < graph_conf["attributes"][class_name].length; i_att++) {
                      var att_key = graph_conf["attributes"][class_name][i_att];
                      if (att_key.startsWith("@")) {
                        if (att_key in a_class_def.edges) {
                          node_data["attribute"][att_key] = [];
                        }
                      }
                    }
                }

                if (is_node) {
                  //assign the index position in the cy_graph_def
                  cy_graph_index.nodes[node_data.id] = cy_graph_def["elements"].nodes.length;
                  cy_graph_def["elements"].nodes.push({"data":node_data});
                }else {
                  class_data_non_nodes[node_data.id] = node_data;
                }
            }

      }

}


function build_panel() {
  var cy_grpah_container = document.getElementById(graph_container);
  var grpah_panel = document.getElementById(graph_panel_container);

  // Add the filter legend
  // ***************************
  var filter_section = document.createElement("div");

  if ("classes" in graph_filter) {
    var list_items = document.createElement("ul");
    for (var i = 0; i < graph_conf.nodes.length; i++) {
      var a_li = document.createElement("li");

      //the corresponding icon
      var svg_shape = null;
      if(graph_conf.nodes[i].group in graph_style.group){
        var gr_style_obj = graph_style.group[graph_conf.nodes[i].group];
        svg_shape = '<circle cx="50" cy="50" r="50" style="fill:'+gr_style_obj["background-color"]+';" />';
        if ("shape" in gr_style_obj) {
          switch (gr_style_obj["shape"]) {
            case "diamond":
              svg_shape = '<polygon points="50,0 100,50 50,100 0,50" style="fill:'+gr_style_obj["background-color"]+';" />';
              break;
            case "pentagon":
              svg_shape = '<polygon points="50,0 100,37 90,100 10,100 0,37" style="fill:'+gr_style_obj["background-color"]+';" />';
              break;
            default:
              svg_shape = '<circle cx="50" cy="50" r="50" style="fill:'+gr_style_obj["background-color"]+';" />';
          }
        }
      }
      var legend_icon = '<svg class="legend-icon" height="100" width="100">'+svg_shape+'</svg>'
      //the label and icon
      var is_checked = "";
      if (graph_filter.classes.indexOf(graph_conf.nodes[i].class) != -1) {
        is_checked = "checked";
      }

      a_li.innerHTML = "<input class='checkbox-node' type='checkbox' value='"+graph_conf.nodes[i].class+"' "+is_checked+"><span>"+graph_conf.nodes[i].class+"</span><span>"+legend_icon+"</span>";
      list_items.appendChild(a_li);
    }
    filter_section.appendChild(list_items);
  }

  // Add the keyword filter
  // ***************************
  if ("keywords" in graph_filter) {
    var a_filter_class_index = class_index[graph_filter.keywords.value];
    var a_filter_attribute = graph_filter.keywords.attribute;
    var keyword_container = document.createElement("div");
    keyword_container.className = "list-keyword";

    i_kw = 0;
    var keyword_value = "Add #keyword";
    do {
      var a_keyword = null;
      if (i_kw == 0) {
        a_keyword = document.createElement("div");
        a_keyword.innerHTML = keyword_value;
        a_keyword.className = "a-keyword first";
        a_keyword.onclick = function(){

          var list_container = document.getElementById("opt_list");
          if (list_container) {
            list_container.remove();
          }else {
            //build the list of options
            if (("value" in graph_filter.keywords) && ("attribute" in graph_filter.keywords)) {
                var list_of_opt = build_list_options(class_index[graph_filter.keywords.value].items, "id", graph_filter.keywords.attribute);
                this.parentNode.insertBefore(list_of_opt, this.nextSibling);
            }
          }
        };
      }else {
        a_keyword = build_a_keyword(keyword_value, keyword_id);
      }

      keyword_container.appendChild(a_keyword);
      keyword_id = graph_filter.keywords.items[i_kw];
      if (keyword_id == undefined) {
        break;
      }else {
        keyword_key = a_filter_class_index.prefix +"/" + keyword_id;
        if (keyword_key in class_data_non_nodes) {
          keyword_value = class_data_non_nodes[keyword_key].attribute[a_filter_attribute];
        }
      }
      i_kw += 1;
    } while (keyword_id != undefined);
    filter_section.appendChild(keyword_container);
  }

  // Add the filter button
  // ***************************
  var apply_filter_btn = document.createElement("button");
  apply_filter_btn.className = "apply-filter-btn";
  apply_filter_btn.innerHTML = "Apply";
  apply_filter_btn.onclick = function(){
    //init graph_filter
    graph_filter.classes = [];

    var list_checkbox_nodes = document.getElementsByClassName("checkbox-node");
    for (var l = 0; l < list_checkbox_nodes.length; l++) {
      if(list_checkbox_nodes[l].checked){
        graph_filter.classes.push(list_checkbox_nodes[l].value);
      }
    }
    build_graph();
  };
  filter_section.appendChild(apply_filter_btn);

  // Add all to the panel
  // ***************************
  if (Object.keys(graph_filter).length > 0) {
    grpah_panel.appendChild(filter_section);
  }else {
    document.documentElement.style.setProperty('--width-panel', '0%');
    document.documentElement.style.setProperty('--width-graph', '100%');
  }


  // Add the events handler
  // ***************************
  cy_graph.nodes().on('click', function(e){
      $(".graph-info-box").remove();
      var attributes = this._private.data.attribute;
      var class_name = this._private.data.item_class;
      if ((attributes != undefined) && (class_name in graph_info_box.nodes)){
          var _ul = document.createElement("div");
          _ul.className = "graph-info-box";

          var _li = document.createElement("div");
          _li.innerHTML = class_name;
          _li.className = "header-class "+class_name;
          //_li.style.color = "blue";
          _ul.appendChild(_li);

          _li = document.createElement("div");
          _li.innerHTML = "&#10005;";
          _li.className = "close-class";
          _li.onclick = function(){$(".graph-info-box").remove();};
          _ul.appendChild(_li);

          var arr_graph_panel_info_att = graph_info_box.nodes[class_name];
          for (var att_k in arr_graph_panel_info_att) {
            if (att_k in attributes) {
              var inner_html_str = "";
              if (att_k.startsWith("@")) {
                for (var att_k_i = 0; att_k_i < attributes[att_k].length; att_k_i++) {
                  if (attributes[att_k][att_k_i] in class_data_non_nodes) {
                    var a_nonnode_obj = class_data_non_nodes[attributes[att_k][att_k_i]];
                    var res = build_one_nonnode(a_nonnode_obj);
                    for (var k_res in res) {
                      inner_html_str = inner_html_str + "<div class='"+k_res+"'>" + res[k_res] + "</div>";
                    }
                  }
                }
              }else {
                inner_html_str = attributes[att_k];
                for (var i_f = 0; i_f < arr_graph_panel_info_att[att_k].length; i_f++) {
                  inner_html_str = Reflect.apply(arr_graph_panel_info_att[att_k][i_f],undefined,[inner_html_str]);
                }
              }

              _li = document.createElement("div");
              var class_att_k = att_k;
              if (class_att_k.startsWith("@")) {
                class_att_k = class_att_k.substring(1,)
              }
              _li.className = "att"+" "+class_att_k;
              _li.innerHTML = inner_html_str;
              _ul.appendChild(_li);
            }
          }
          grpah_panel.appendChild(_ul);
      }
  });

  function build_one_nonnode(a_nonnode) {
      var current_class = a_nonnode.item_class;
      if (current_class in graph_info_box.nodes) {
        var relations_to_process = {};
        var res = {};

        // check all the inner attributes
        for (var att_k in graph_info_box.nodes[current_class]) {
          if (att_k.startsWith("@")) {
            if (att_k in a_nonnode.attribute) {
              relations_to_process[att_k] = a_nonnode.attribute[att_k];
            }
          }else {
            var inner_html_str = a_nonnode.attribute[att_k];
            for (var i_f = 0; i_f < graph_info_box.nodes[current_class][att_k].length; i_f++) {
              inner_html_str = Reflect.apply(arr_graph_panel_info_att[att_k][i_f],undefined,[inner_html_str]);
            }
            //res[att_k] = a_nonnode.attribute[att_k];
            res[att_k] = inner_html_str;
          }
        }

        if (Object.keys(relations_to_process).length == 0) {
          return res;
        }else {
          for (var att_k in relations_to_process) {
            for (var i_att_k = 0; i_att_k < relations_to_process[att_k].length; i_att_k++) {
              res = Object.assign({}, res, build_one_nonnode(class_data_non_nodes[relations_to_process[att_k][i_att_k]]));
            }
          }
          return res;
        }
      }
  }

  function build_list_options(list, id_val_att, val_att) {
    var sorted_values = [];
    for (var i = 0; i < list.length; i++) {
      if (val_att in list[i].attribute) {
        sorted_values.push({
          "val": list[i].attribute[val_att],
          "id": list[i][id_val_att]
        });
      }
    }

    /*sort array of objects*/
    sorted_values = sorted_values.sort(compare);
    function compare( a, b ) {
      if ( a.val < b.val ){
        return -1;
      }
      if ( a.val > b.val ){
        return 1;
      }
      return 0;
    }

    //add the html component
    var list_container = document.createElement("div");
    list_container.id = "opt_list";
    list_container.className = "opt-list "+val_att;
    for (var i = 0; i < sorted_values.length; i++) {
      var a_list_elem = document.createElement("div");
      a_list_elem.className = "opt-list-item";
      a_list_elem.id = sorted_values[i].id;
      a_list_elem.value = sorted_values[i].val;
      a_list_elem.innerHTML = sorted_values[i].val;
      list_container.appendChild(a_list_elem);

      a_list_elem.onclick = function(){
        document.getElementById("opt_list").remove();
        keyword_container.appendChild(build_a_keyword(this.value,this.id));
        graph_filter.keywords.items.push(this.id);
      };
    }

    return list_container;
  }

  function build_a_keyword(val,id) {
    var a_add_keyword = document.createElement("div");

    var a_close_icon = document.createElement("div");
    a_close_icon.className = 'close-class';
    a_close_icon.id = id;
    a_close_icon.value = val;
    a_close_icon.innerHTML = "&#10005;";
    a_close_icon.onclick = function(){
      var index = graph_filter.keywords.items.indexOf(this.id.toString());
      if (index != -1) {
        graph_filter.keywords.items.splice(index, 1);
      }
      this.parentNode.remove();
    }

    a_add_keyword.className = "a-keyword";
    a_add_keyword.innerHTML = "<span class='value'>"+val+"</span>";
    a_add_keyword.appendChild(a_close_icon);
    return a_add_keyword;
  }

}
