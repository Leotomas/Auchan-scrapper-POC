module.exports =  function(socket, Vue) {
    var _     = require('underscore');
    var chart = require('highcharts');
    new Vue({
        el : 'body',
        ready : function() {
            var that = this;
            var data = {};
            socket.on('fetchedResultsData', function(data){
                that.data = data;
            });
        },

        data : {
            data : {},
            filters : {
                games : 0,
                bo : 'all'
            },
            sorting : {
                attribute : 'delta',
                order : 'desc',
            },

            states: {
                tab : 'teams',
            }
        },

        computed : {
            chartsData : function() {
                var data = {
                    labels: ["A", "B", "C"],
                    series:[[1, 3, 2], [4, 6, 5]]
                };
                return {
                    odds_1 : data,
                    options_1 : {}
                };
            },

            origTeamsLength : function() {
                if (this.data.teams) {
                    return Object.keys(this.data.teams).length;
                }
            },

            teamsData : function() {
                var o = [];
                var data = null;
                if (this.filters.bo == 'all') {
                    data = this.data.teams;
                } else if (this.filters.bo == 'bo1') {
                    data = this.data.teams_bo1;
                } else if (this.filters.bo == 'bo3') {
                    data = this.data.teams_bo3;
                }

                for (var i in data) {
                    o.push({
                        name : data[i].name,
                        winrate : data[i].stats.winrate,
                        average_odds : data[i].stats.average_odds,
                        delta : data[i].stats.delta,
                        games :  data[i].stats.games
                    });
                }
                o = _.sortBy(o, this.sorting.attribute);
                if (this.sorting.order == 'desc') {
                    o.reverse();
                }
                console.log(o.length);
                var min_games =  parseInt(this.filters.games);
                var o_n = [];
                o.forEach(function(element, index, array){
                    if (element.games >=  min_games) {
                        o_n.push(element);
                    }
                });
                return o_n;
            }
        },

        methods : {
            highlighter : function(value, min, max) {
                var val = parseInt(value);
                if (val > max) {
                    return 'good';
                }
                else if (val < min) {
                    return 'bad';
                }
                return 'neutral';
            },

            switchTab : function(tab) {
                this.states.tab = tab;
                this.drawGraphs();
            },

            drawGraphs : function() {
                var that = this, x = [], y = [], marker = [];
                var distrib;
                if (this.filters.bo == 'all') {
                    distrib = this.data.distribution;
                } else if (this.filters.bo == 'bo1') {
                    distrib = this.data.distribution_bo1;
                } else if (this.filters.bo == 'bo3') {
                    distrib = this.data.distribution_bo3;
                }
                console.log(distrib);

                for (var i in distrib) {
                    x.push(distrib[i].odds);
                    y.push(distrib[i].winrate);
                }
                console.log(x);

                setTimeout(function(){
                    var container = document.getElementById('Graph__odds1');
                    var chart1;
                    chart1 = new chart.Chart({
                        chart: {
                            title : 'Winrates by odds',
                            type : 'column',
                            renderTo: container
                        },

                        tooltip : {
                            valueDecimals :  2
                        },

                        xAxis : {
                            categories : x,
                            title : {
                                text : 'odds'
                            }
                        },

                        yAxis : {
                            title :  {
                                text : 'winrate'
                            }
                        },

                        series : [{
                            name : 'winrates by odds',
                            type : 'column',
                            data : y
                        },
                        {
                            name : 'theoretical winrate by odds',
                            type : 'line',
                            data :  x
                        }
                        ]
                    });
                }, 100);
            },


            navClass : function(item) {
                if (this.states.tab == item) {
                    return 'current';
                }
                return '';
            },
        }
    });
};
