// CONST variables
var graph_container = "cy";
var graph_panel_container = "cy_panel";
var model_url = "https://ivanhb.github.io/edu/model/";

var graph_conf = {
  "nodes": [
    {"group":"7", "class":"Code"},
    {"group":"5", "class":"Publication"},
    {"group":"1", "class":"Activity"},
    {"group":"4", "class":"Organization"},
    {"group":"2", "class":"Project"},
    {"group":"3", "class":"Demo"},
    {"group":"3", "class":"Presentation"},
    //{"group":"6", "class":"Report"}
  ],
  "edges": [
    "@hasWork",
    "@hasIllustration",
    "@hasProduct",
    "@hasOrganization"
  ],
  "attributes":{
    "Publication":["nickname","reference","reference_format","author","date","persistent_id","persistent_id_type"],
    "Code":["nickname","title","subtitle","date","persistent_id","persistent_id_type","source"],
    "Activity":["nickname","title","subtitle","date","description","contribution","location","webpage","start_date","end_date"],
    "Organization":["nickname","name","description","personal_webpage","logo","webpage","start_date","end_date"],
    "Project":["nickname","name","description","personal_webpage","logo","webpage","start_date","end_date"],
    "Demo":["nickname","source","title","subtitle","persistent_id","persistent_id_type","date"],
    "Presentation":["nickname","source","title","subtitle","persistent_id","persistent_id_type","date"]
  },
  "properties": {
    "Keyword": ["value"],
    "Member": ["role","@hasPerson"],
    "Person":["nickname","name","position","affiliation","webpage"]
  }
}
var graph_style = {
    "group": {
      "1": {
        'shape': 'diamond',
        'width': '35',
        'height': '35',
        'background-color': '#ee7a22',
        'label': 'data(attribute.nickname)'
      },
      "2": {
        'shape': 'pentagon',
        'width': '50',
        'height': '50',
        'background-color': '#2296EE',
        'label': 'data(attribute.nickname)'
      },
      "3": {
        'shape': 'diamond',
        'width': '20',
        'height': '20',
        'background-color': '#CE1271',
        'label': 'data(attribute.nickname)'
      },
      "5": {
        'width': '20',
        'height': '20',
        'background-color': '#F4D03F',
        'label': 'data(attribute.nickname)'
      },
      "4": {
        'shape': 'pentagon',
        'width': '100',
        'height': '100',
        'background-color': '#2F8A60',
        'label': 'data(attribute.nickname)'
      },
      "7": {
        'shape': 'diamond',
        'width': '20',
        'height': '20',
        'background-color': '#9E4FC5',
        'label': 'data(attribute.nickname)'
      }
    }
}
var graph_filter = {"nodes":["Code","Publication","Activity","Organization","Project","Demo","Presentation"]};
var graph_info_panel = {
  nodes:{
    "Code": {"title":[],"source":[is_link]},
    "Publication": {"reference":[],"persistent_id":[is_link]},
    "Activity": {"start_date":[],"end_date":[is_end_date],"location":[],"title":[],"subtitle":[],"contribution":[is_contribution],"webpage":[is_webpage]},
    "Organization": {"start_date":[],"end_date":[is_end_date],"name":[],"description":[],"personal_webpage":[],"webpage":[is_webpage]},
    "Project": {"start_date":[],"end_date":[is_end_date],"name":[],"description":[],"personal_webpage":[is_personal_webpage],"webpage":[is_webpage]},
    "Demo": {"title":[],"source":[is_link]},
    "Presentation": {"title":[],"source":[is_link]}
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

// the definition of the cy_graph
// this variable will be the input of cytoscape() to define the cy graph, after the end of definition process
var cy_graph_def = {}

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
  cy_graph_index = {"nodes":{},"edges":{},"properties":{}};
}

function def_class(class_name){

  var class_file = "";
  var class_tree = [];
  var class_relation = {};
  var class_properties = {};

  var init_class_name = class_name;
  do {
    class_tree.push(init_class_name);
    data_class_obj = model_index["class"][init_class_name];
    for (var rel_k in data_class_obj["relation"]) {
      if (graph_conf.edges.indexOf(rel_k) != -1) {
        class_relation[rel_k] = data_class_obj["relation"][rel_k];
      }else {
        if (data_class_obj["relation"][rel_k] in graph_conf.properties) {
          class_properties[rel_k] = data_class_obj["relation"][rel_k];
        }
      }
    }
    init_class_name = data_class_obj["@isSubclassOf"];
  } while (init_class_name != undefined);

  for (var i = 1; i < class_tree.length; i++) {
    class_file = class_tree[i].toLowerCase() + "/" + class_file;
  }
  class_file = class_file + class_name.toLowerCase()+".json";

  return {
    "items": [],
    "tree": class_tree,
    "relation": class_relation,
    "properties": class_properties,
    "file": "src/"+class_file,
    "prefix": data_class_obj["prefix"]
  }
}

function build_graph() {

  // init all the graph elements
  init();

  // Define the processing index
  for (var a_class in model_index["class"]) {
    var a_class_def = def_class(a_class, model_index);
    class_index[a_class] = a_class_def;
  }

  process_nodes(0);

  function process_nodes(index){
    var class_name = graph_conf["nodes"][index]["class"];

    //get from index all the vars of this Class
    var a_class_def = class_index[class_name];
    $.ajax({
            type: "GET",
            url: model_url+a_class_def.file,
            dataType: "json",
            async: true,
            success: function(a_class_file_data) {
              if (graph_filter.nodes.indexOf(class_name) != -1) {
                  if ("items" in a_class_file_data) {

                        class_index[class_name]["items"] = a_class_file_data["items"];

                        // ----------
                        // The Nodes
                        // ----------
                        for (var i = 0; i < a_class_file_data["items"].length; i++) {
                              var elem_node = {};
                              var _data_item = a_class_file_data["items"][i];
                              var elem_data = {
                                  "id": a_class_def.prefix+"/"+_data_item["id"],
                                  "item_class": class_name,
                                  "attribute": {},
                                  "properties": {}
                              }
                              if (class_name in graph_conf["attributes"]) {
                                for (var att_key in _data_item["attribute"]) {
                                  if (graph_conf["attributes"][class_name].indexOf(att_key) != -1) {
                                    elem_data["attribute"][att_key] = _data_item["attribute"][att_key];
                                  }
                                }
                              }

                              elem_node["data"] = elem_data;
                              //assign the index position in the cy_graph_def
                              cy_graph_index.nodes[elem_node.data.id] = cy_graph_def["elements"].nodes.length;
                              cy_graph_def["elements"].nodes.push(elem_node);
                          }

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

                if (index < graph_conf["nodes"].length - 1) {
                  process_nodes(index + 1)
                }else {
                  process_edges();

                  process_properties();

                  // Ready to build all
                  cy_graph = cytoscape(cy_graph_def);
                  build_panel();
                  console.log(cy_graph_def);
                  console.log(class_index);
                  console.log(cy_graph_index);
                }
            }
    });
  }

  function process_edges() {

      for (var class_name in class_index) {
        var a_class_def = class_index[class_name];

        // ----------
        // The Edges
        // ----------
        for (var i = 0; i < class_index[class_name]["items"].length; i++) {
            var _data_item = class_index[class_name]["items"][i];
            if ("relation" in _data_item) {
              for (var relation_key in _data_item["relation"]) {
                  if (relation_key in a_class_def.relation) {
                    for (var k = 0; k < _data_item["relation"][relation_key].length; k++) {
                        var elem_edge = {"data":{}};
                        elem_edge.data["source"] = a_class_def.prefix+"/"+_data_item["id"];

                        var target_class = a_class_def.relation[relation_key];
                        if (!(target_class in graph_conf.properties)) {
                          var target_prefix = class_index[target_class].prefix;
                          var target_id = target_prefix+"/"+_data_item["relation"][relation_key][k];

                          if(target_id in cy_graph_index.nodes){
                            elem_edge.data["target"] = target_prefix+"/"+_data_item["relation"][relation_key][k];
                            elem_edge.data["id"] = relation_key+":"+elem_edge.data["source"]+";"+elem_edge.data["target"];
                            cy_graph_index.edges[elem_edge.data.id] = cy_graph_def["elements"].edges.length;
                            cy_graph_def["elements"].edges.push(elem_edge);
                          }
                        }
                    }
                  }else {
                    //maybe the relation is a property
                    if (relation_key in a_class_def.properties) {
                      var source_id = a_class_def.prefix+"/"+_data_item["id"];
                      var prefix_of_prop = class_index[a_class_def.properties[relation_key]].prefix;
                      //update the corresponding node with its properties
                      if (source_id in cy_graph_index.nodes) {
                        // add this relation in the properities of the node
                        var corresponding_node_prop = cy_graph_def["elements"].nodes[cy_graph_index.nodes[source_id]].data.properties;
                        corresponding_node_prop[relation_key] = [];

                        //for each id of such relation add it with its corresponding prefix
                        for (var k = 0; k < _data_item["relation"][relation_key].length; k++) {
                          var target_id = prefix_of_prop+"/"+_data_item["relation"][relation_key][k];
                          corresponding_node_prop[relation_key].push(target_id);

                          // update the cy_graph index
                          if (!(target_id in cy_graph_index.properties)) {
                            cy_graph_index.properties[target_id] = [];
                          }
                          cy_graph_index.properties[target_id].push(source_id);

                        }
                      }
                    }
                  }
              }
            }
        }
      }
  }

  function process_properties(){
    var prop_data = {};
    var prop_relation = {};
    var prop_keys = Object.keys(graph_conf["properties"]);
    if (prop_keys.length > 0) {
      get_properties_class_data(0,prop_keys,graph_conf["properties"]);
    }

    function get_properties_class_data(i_k,a_list,graph_conf_properities) {
      //get from index all the vars of this Class
      var a_class_name = a_list[i_k];
      var a_arr_att = graph_conf_properities[a_class_name];
      var a_class_def = class_index[a_class_name];
      var prop_class_prefix = a_class_def.prefix;

      $.ajax({
              type: "GET",
              url: model_url+a_class_def.file,
              dataType: "json",
              async: true,
              success: function(a_class_file_data) {
                console.log(a_class_file_data);

                //now check all the elements which have properties and update them
                for (var i_prop = 0; i_prop < a_class_file_data.items.length; i_prop++) {
                  //the id (with prefix) of the properity
                  var id_prop = prop_class_prefix+"/"+a_class_file_data.items[i_prop].id;

                  // we need to build this property with all its corresponding attributes
                  prop_data[id_prop] = build_class_data(a_class_name, a_arr_att, a_class_file_data.items[i_prop], "properties");

                }

                if (i_k < a_list.length - 1) {
                  get_properties_class_data(i_k + 1, a_list, graph_conf_properities)
                }else {

                  //embed together properities
                  for (var a_prop_id in prop_data) {
                    for (var att_key in prop_data[a_prop_id]) {
                      if (att_key.startsWith("@")) {
                        //check all the elements of the @...
                        for (var i = 0; i < prop_data[a_prop_id][att_key].length; i++) {
                          if(prop_data[a_prop_id][att_key][i] in prop_data){
                            prop_data[a_prop_id] = Object.assign({}, prop_data[a_prop_id], prop_data[prop_data[a_prop_id][att_key][i]]);
                          }
                        }
                        delete prop_data[a_prop_id][att_key];
                      }
                    }
                  }

                  console.log(prop_data);
                  //assign_prop_data_to_nodes();
                }
              }
      });
    }

    //giveb a class it will build all its data
    // the attributes will include the attributes of its realtion classes if they appear in arr_att
    function build_class_data(class_name, arr_att, elem_data, relation_type = "relation"){
        var res = {};

        if ("attribute" in elem_data) {
          for (var an_att in elem_data.attribute) {
            if (arr_att.indexOf(an_att) != -1) {
              res[an_att] = elem_data.attribute[an_att];
            }
          }
        }

        if ("relation" in elem_data) {
          for (var an_att in elem_data.relation) {
            if (arr_att.indexOf(an_att) != -1) {
              var target_class = class_index[class_name][relation_type][an_att];
              res[an_att] = elem_data.relation[an_att];
              for (var i = 0; i < res[an_att].length; i++) {
                res[an_att][i] = class_index[target_class].prefix + "/" + res[an_att][i];
              }
            }
          }
        }

        return res;
    }

    function assign_prop_data_to_nodes(){

    }

  }
}


function build_panel() {
  var grpah_panel = document.getElementById(graph_panel_container);

  // Add the filter legend
  // ***************************
  var legend_container = document.createElement("div");

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
    if (graph_filter.nodes.indexOf(graph_conf.nodes[i].class) != -1) {
      is_checked = "checked";
    }

    a_li.innerHTML = "<input class='checkbox-node' type='checkbox' value='"+graph_conf.nodes[i].class+"' "+is_checked+"><span>"+graph_conf.nodes[i].class+"</span><span>"+legend_icon+"</span>";
    list_items.appendChild(a_li);
  }
  legend_container.appendChild(list_items);

  // Add the filter button
  // ***************************
  var apply_filter_btn = document.createElement("button");
  apply_filter_btn.className = "apply-filter-btn";
  apply_filter_btn.innerHTML = "Apply";
  apply_filter_btn.onclick = function(){
    //init graph_filter
    graph_filter.nodes = [];

    var list_checkbox_nodes = document.getElementsByClassName("checkbox-node");
    for (var l = 0; l < list_checkbox_nodes.length; l++) {
      if(list_checkbox_nodes[l].checked){
        graph_filter.nodes.push(list_checkbox_nodes[l].value);
      }
    }
    build_graph();
  };
  legend_container.appendChild(apply_filter_btn);

  // Add all to the panel
  // ***************************
  grpah_panel.appendChild(legend_container);


  // Add the events handler
  // ***************************
  cy_graph.nodes().on('click', function(e){
      $(".graph-info-box").remove();
      var attributes = this._private.data.attribute;
      var class_name = this._private.data.item_class;
      if ((attributes != undefined) && (class_name in graph_info_panel.nodes)){
          var _ul = document.createElement("div");
          _ul.className = "graph-info-box";
          var _li = document.createElement("div");
          _li.innerHTML = class_name;
          _li.className = "header-class";
          //_li.style.color = "blue";
          _ul.appendChild(_li);

          var arr_graph_panel_info_att = graph_info_panel.nodes[class_name];
          for (var att_k in arr_graph_panel_info_att) {
            if (att_k in attributes) {

              var inner_html_str = attributes[att_k];
              for (var i_f = 0; i_f < arr_graph_panel_info_att[att_k].length; i_f++) {
                inner_html_str = Reflect.apply(arr_graph_panel_info_att[att_k][i_f],undefined,[inner_html_str]);
              }

              _li = document.createElement("div");
              _li.className = att_k;
              _li.innerHTML = inner_html_str;
              _ul.appendChild(_li);
            }
          }
          console.log(_ul);
          grpah_panel.appendChild(_ul);
      }
  });
}
