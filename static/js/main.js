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
    "Keyword": ["value"]
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
        'width': '35',
        'height': '35',
        'background-color': '#ee7a22',
        'label': 'data(attribute.nickname)'
      },
      "002": {
        'shape': 'pentagon',
        'width': '50',
        'height': '50',
        'background-color': '#2296EE',
        'label': 'data(attribute.nickname)'
      },
      "003": {
        'shape': 'diamond',
        'width': '20',
        'height': '20',
        'background-color': '#CE1271',
        'label': 'data(attribute.nickname)'
      },
      "005": {
        'width': '20',
        'height': '20',
        'background-color': '#F4D03F',
        'label': 'data(attribute.nickname)'
      },
      "004": {
        'shape': 'pentagon',
        'width': '100',
        'height': '100',
        'background-color': '#2F8A60',
        'label': 'data(attribute.nickname)'
      },
      "007": {
        'shape': 'diamond',
        'width': '20',
        'height': '20',
        'background-color': '#9E4FC5',
        'label': 'data(attribute.nickname)'
      }
    }
}
var graph_filter = {
  "nodes":["Code","Publication","Activity","Organization","Project","Demo","Presentation"]
};
var graph_info_panel = {
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
    "Person":{"nickname":[]}
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

  var init_class_name = class_name;
  do {
    class_tree.push(init_class_name);
    data_class_obj = model_index["class"][init_class_name];
    //add the relations which are edges
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
              if (graph_filter.nodes.indexOf(class_name) != -1) {
                  if ("items" in a_class_file_data) {

                          class_index[class_name]["items"] = a_class_file_data["items"];

                          def_elems(class_name, a_class_def, a_class_file_data);

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

          // Ready to build all
          cy_graph = cytoscape(cy_graph_def);
          build_panel();
          console.log(class_data_non_nodes);
          console.log(cy_graph_def);
          console.log(class_index);
          console.log(cy_graph_index);
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

          _li = document.createElement("div");
          _li.innerHTML = "&#10005;";
          _li.className = "close-class";
          _li.onclick = function(){$(".graph-info-box").remove();};
          _ul.appendChild(_li);

          var arr_graph_panel_info_att = graph_info_panel.nodes[class_name];
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
      if (current_class in graph_info_panel.nodes) {
        var relations_to_process = {};
        var res = {};

        // check all the inner attributes
        for (var att_k in graph_info_panel.nodes[current_class]) {
          if (att_k.startsWith("@")) {
            if (att_k in a_nonnode.attribute) {
              relations_to_process[att_k] = a_nonnode.attribute[att_k];
            }
          }else {
            var inner_html_str = a_nonnode.attribute[att_k];
            for (var i_f = 0; i_f < graph_info_panel.nodes[current_class][att_k].length; i_f++) {
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

}
