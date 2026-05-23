<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
	xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
	xmlns:ccts="urn:un:unece:uncefact:documentation:2"
	xmlns:clm54217="urn:un:unece:uncefact:codelist:specification:54217:2001"
	xmlns:clm5639="urn:un:unece:uncefact:codelist:specification:5639:1988"
	xmlns:clm66411="urn:un:unece:uncefact:codelist:specification:66411:2001"
	xmlns:clmIANAMIMEMediaType="urn:un:unece:uncefact:codelist:specification:IANAMIMEMediaType:2003"
	xmlns:fn="http://www.w3.org/2005/xpath-functions" xmlns:link="http://www.xbrl.org/2003/linkbase"
	xmlns:n1="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
	xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2"
	xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2"
	xmlns:xbrldi="http://xbrl.org/2006/xbrldi" xmlns:xbrli="http://www.xbrl.org/2003/instance"
	xmlns:xdt="http://www.w3.org/2005/xpath-datatypes" xmlns:xlink="http://www.w3.org/1999/xlink"
	xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsd="http://www.w3.org/2001/XMLSchema"
	xmlns:lcl="http://www.efatura.gov.tr/local"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	exclude-result-prefixes="cac cbc ccts clm54217 clm5639 clm66411 clmIANAMIMEMediaType fn link n1 qdt udt xbrldi xbrli xdt xlink xs xsd xsi lcl">
	<xsl:character-map name="a"> 
		<xsl:output-character character="&#128;" string=""/>
		<xsl:output-character character="&#129;" string=""/>
		<xsl:output-character character="&#130;" string=""/>
		<xsl:output-character character="&#131;" string=""/>
		<xsl:output-character character="&#132;" string=""/>
		<xsl:output-character character="&#133;" string=""/>
		<xsl:output-character character="&#134;" string=""/>
		<xsl:output-character character="&#135;" string=""/>
		<xsl:output-character character="&#136;" string=""/>
		<xsl:output-character character="&#137;" string=""/>
		<xsl:output-character character="&#138;" string=""/>
		<xsl:output-character character="&#139;" string=""/>
		<xsl:output-character character="&#140;" string=""/>
		<xsl:output-character character="&#141;" string=""/>
		<xsl:output-character character="&#142;" string=""/>
		<xsl:output-character character="&#143;" string=""/>
		<xsl:output-character character="&#144;" string=""/>
		<xsl:output-character character="&#145;" string=""/>
		<xsl:output-character character="&#146;" string=""/>
		<xsl:output-character character="&#147;" string=""/>
		<xsl:output-character character="&#148;" string=""/>
		<xsl:output-character character="&#149;" string=""/>
		<xsl:output-character character="&#150;" string=""/>
		<xsl:output-character character="&#151;" string=""/>
		<xsl:output-character character="&#152;" string=""/>
		<xsl:output-character character="&#153;" string=""/>
		<xsl:output-character character="&#154;" string=""/>
		<xsl:output-character character="&#155;" string=""/>
		<xsl:output-character character="&#156;" string=""/>
		<xsl:output-character character="&#157;" string=""/>
		<xsl:output-character character="&#158;" string=""/>
		<xsl:output-character character="&#159;" string=""/>
	</xsl:character-map>
	<xsl:decimal-format name="european" decimal-separator="," grouping-separator="." NaN=""/>
	<xsl:output version="4.0" method="html" indent="no" encoding="UTF-8"
		doctype-public="-//W3C//DTD HTML 4.01 Transitional//EN"
		doctype-system="http://www.w3.org/TR/html4/loose.dtd" use-character-maps="a"/>
	<xsl:param name="SV_OutputFormat" select="'HTML'"/>
	<xsl:variable name="XML" select="/"/>	
	
	<xsl:template match="/">
		<html>
			<head>
			<script type="text/javascript">
				<![CDATA[var QRCode;!function(){function a(a){this.mode=c.MODE_8BIT_BYTE,this.data=a,this.parsedData=[];for(var b=[],d=0,e=this.data.length;e>d;d++){var f=this.data.charCodeAt(d);f>65536?(b[0]=240|(1835008&f)>>>18,b[1]=128|(258048&f)>>>12,b[2]=128|(4032&f)>>>6,b[3]=128|63&f):f>2048?(b[0]=224|(61440&f)>>>12,b[1]=128|(4032&f)>>>6,b[2]=128|63&f):f>128?(b[0]=192|(1984&f)>>>6,b[1]=128|63&f):b[0]=f,this.parsedData=this.parsedData.concat(b)}this.parsedData.length!=this.data.length&&(this.parsedData.unshift(191),this.parsedData.unshift(187),this.parsedData.unshift(239))}function b(a,b){this.typeNumber=a,this.errorCorrectLevel=b,this.modules=null,this.moduleCount=0,this.dataCache=null,this.dataList=[]}function i(a,b){if(void 0==a.length)throw new Error(a.length+"/"+b);for(var c=0;c<a.length&&0==a[c];)c++;this.num=new Array(a.length-c+b);for(var d=0;d<a.length-c;d++)this.num[d]=a[d+c]}function j(a,b){this.totalCount=a,this.dataCount=b}function k(){this.buffer=[],this.length=0}function m(){return"undefined"!=typeof CanvasRenderingContext2D}function n(){var a=!1,b=navigator.userAgent;return/android/i.test(b)&&(a=!0,aMat=b.toString().match(/android ([0-9]\.[0-9])/i),aMat&&aMat[1]&&(a=parseFloat(aMat[1]))),a}function r(a,b){for(var c=1,e=s(a),f=0,g=l.length;g>=f;f++){var h=0;switch(b){case d.L:h=l[f][0];break;case d.M:h=l[f][1];break;case d.Q:h=l[f][2];break;case d.H:h=l[f][3]}if(h>=e)break;c++}if(c>l.length)throw new Error("Too long data");return c}function s(a){var b=encodeURI(a).toString().replace(/\%[0-9a-fA-F]{2}/g,"a");return b.length+(b.length!=a?3:0)}a.prototype={getLength:function(){return this.parsedData.length},write:function(a){for(var b=0,c=this.parsedData.length;c>b;b++)a.put(this.parsedData[b],8)}},b.prototype={addData:function(b){var c=new a(b);this.dataList.push(c),this.dataCache=null},isDark:function(a,b){if(0>a||this.moduleCount<=a||0>b||this.moduleCount<=b)throw new Error(a+","+b);return this.modules[a][b]},getModuleCount:function(){return this.moduleCount},make:function(){this.makeImpl(!1,this.getBestMaskPattern())},makeImpl:function(a,c){this.moduleCount=4*this.typeNumber+17,this.modules=new Array(this.moduleCount);for(var d=0;d<this.moduleCount;d++){this.modules[d]=new Array(this.moduleCount);for(var e=0;e<this.moduleCount;e++)this.modules[d][e]=null}this.setupPositionProbePattern(0,0),this.setupPositionProbePattern(this.moduleCount-7,0),this.setupPositionProbePattern(0,this.moduleCount-7),this.setupPositionAdjustPattern(),this.setupTimingPattern(),this.setupTypeInfo(a,c),this.typeNumber>=7&&this.setupTypeNumber(a),null==this.dataCache&&(this.dataCache=b.createData(this.typeNumber,this.errorCorrectLevel,this.dataList)),this.mapData(this.dataCache,c)},setupPositionProbePattern:function(a,b){for(var c=-1;7>=c;c++)if(!(-1>=a+c||this.moduleCount<=a+c))for(var d=-1;7>=d;d++)-1>=b+d||this.moduleCount<=b+d||(this.modules[a+c][b+d]=c>=0&&6>=c&&(0==d||6==d)||d>=0&&6>=d&&(0==c||6==c)||c>=2&&4>=c&&d>=2&&4>=d?!0:!1)},getBestMaskPattern:function(){for(var a=0,b=0,c=0;8>c;c++){this.makeImpl(!0,c);var d=f.getLostPoint(this);(0==c||a>d)&&(a=d,b=c)}return b},createMovieClip:function(a,b,c){var d=a.createEmptyMovieClip(b,c),e=1;this.make();for(var f=0;f<this.modules.length;f++)for(var g=f*e,h=0;h<this.modules[f].length;h++){var i=h*e,j=this.modules[f][h];j&&(d.beginFill(0,100),d.moveTo(i,g),d.lineTo(i+e,g),d.lineTo(i+e,g+e),d.lineTo(i,g+e),d.endFill())}return d},setupTimingPattern:function(){for(var a=8;a<this.moduleCount-8;a++)null==this.modules[a][6]&&(this.modules[a][6]=0==a%2);for(var b=8;b<this.moduleCount-8;b++)null==this.modules[6][b]&&(this.modules[6][b]=0==b%2)},setupPositionAdjustPattern:function(){for(var a=f.getPatternPosition(this.typeNumber),b=0;b<a.length;b++)for(var c=0;c<a.length;c++){var d=a[b],e=a[c];if(null==this.modules[d][e])for(var g=-2;2>=g;g++)for(var h=-2;2>=h;h++)this.modules[d+g][e+h]=-2==g||2==g||-2==h||2==h||0==g&&0==h?!0:!1}},setupTypeNumber:function(a){for(var b=f.getBCHTypeNumber(this.typeNumber),c=0;18>c;c++){var d=!a&&1==(1&b>>c);this.modules[Math.floor(c/3)][c%3+this.moduleCount-8-3]=d}for(var c=0;18>c;c++){var d=!a&&1==(1&b>>c);this.modules[c%3+this.moduleCount-8-3][Math.floor(c/3)]=d}},setupTypeInfo:function(a,b){for(var c=this.errorCorrectLevel<<3|b,d=f.getBCHTypeInfo(c),e=0;15>e;e++){var g=!a&&1==(1&d>>e);6>e?this.modules[e][8]=g:8>e?this.modules[e+1][8]=g:this.modules[this.moduleCount-15+e][8]=g}for(var e=0;15>e;e++){var g=!a&&1==(1&d>>e);8>e?this.modules[8][this.moduleCount-e-1]=g:9>e?this.modules[8][15-e-1+1]=g:this.modules[8][15-e-1]=g}this.modules[this.moduleCount-8][8]=!a},mapData:function(a,b){for(var c=-1,d=this.moduleCount-1,e=7,g=0,h=this.moduleCount-1;h>0;h-=2)for(6==h&&h--;;){for(var i=0;2>i;i++)if(null==this.modules[d][h-i]){var j=!1;g<a.length&&(j=1==(1&a[g]>>>e));var k=f.getMask(b,d,h-i);k&&(j=!j),this.modules[d][h-i]=j,e--,-1==e&&(g++,e=7)}if(d+=c,0>d||this.moduleCount<=d){d-=c,c=-c;break}}}},b.PAD0=236,b.PAD1=17,b.createData=function(a,c,d){for(var e=j.getRSBlocks(a,c),g=new k,h=0;h<d.length;h++){var i=d[h];g.put(i.mode,4),g.put(i.getLength(),f.getLengthInBits(i.mode,a)),i.write(g)}for(var l=0,h=0;h<e.length;h++)l+=e[h].dataCount;if(g.getLengthInBits()>8*l)throw new Error("code length overflow. ("+g.getLengthInBits()+">"+8*l+")");for(g.getLengthInBits()+4<=8*l&&g.put(0,4);0!=g.getLengthInBits()%8;)g.putBit(!1);for(;;){if(g.getLengthInBits()>=8*l)break;if(g.put(b.PAD0,8),g.getLengthInBits()>=8*l)break;g.put(b.PAD1,8)}return b.createBytes(g,e)},b.createBytes=function(a,b){for(var c=0,d=0,e=0,g=new Array(b.length),h=new Array(b.length),j=0;j<b.length;j++){var k=b[j].dataCount,l=b[j].totalCount-k;d=Math.max(d,k),e=Math.max(e,l),g[j]=new Array(k);for(var m=0;m<g[j].length;m++)g[j][m]=255&a.buffer[m+c];c+=k;var n=f.getErrorCorrectPolynomial(l),o=new i(g[j],n.getLength()-1),p=o.mod(n);h[j]=new Array(n.getLength()-1);for(var m=0;m<h[j].length;m++){var q=m+p.getLength()-h[j].length;h[j][m]=q>=0?p.get(q):0}}for(var r=0,m=0;m<b.length;m++)r+=b[m].totalCount;for(var s=new Array(r),t=0,m=0;d>m;m++)for(var j=0;j<b.length;j++)m<g[j].length&&(s[t++]=g[j][m]);for(var m=0;e>m;m++)for(var j=0;j<b.length;j++)m<h[j].length&&(s[t++]=h[j][m]);return s};for(var c={MODE_NUMBER:1,MODE_ALPHA_NUM:2,MODE_8BIT_BYTE:4,MODE_KANJI:8},d={L:1,M:0,Q:3,H:2},e={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7},f={PATTERN_POSITION_TABLE:[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],G15:1335,G18:7973,G15_MASK:21522,getBCHTypeInfo:function(a){for(var b=a<<10;f.getBCHDigit(b)-f.getBCHDigit(f.G15)>=0;)b^=f.G15<<f.getBCHDigit(b)-f.getBCHDigit(f.G15);return(a<<10|b)^f.G15_MASK},getBCHTypeNumber:function(a){for(var b=a<<12;f.getBCHDigit(b)-f.getBCHDigit(f.G18)>=0;)b^=f.G18<<f.getBCHDigit(b)-f.getBCHDigit(f.G18);return a<<12|b},getBCHDigit:function(a){for(var b=0;0!=a;)b++,a>>>=1;return b},getPatternPosition:function(a){return f.PATTERN_POSITION_TABLE[a-1]},getMask:function(a,b,c){switch(a){case e.PATTERN000:return 0==(b+c)%2;case e.PATTERN001:return 0==b%2;case e.PATTERN010:return 0==c%3;case e.PATTERN011:return 0==(b+c)%3;case e.PATTERN100:return 0==(Math.floor(b/2)+Math.floor(c/3))%2;case e.PATTERN101:return 0==b*c%2+b*c%3;case e.PATTERN110:return 0==(b*c%2+b*c%3)%2;case e.PATTERN111:return 0==(b*c%3+(b+c)%2)%2;default:throw new Error("bad maskPattern:"+a)}},getErrorCorrectPolynomial:function(a){for(var b=new i([1],0),c=0;a>c;c++)b=b.multiply(new i([1,g.gexp(c)],0));return b},getLengthInBits:function(a,b){if(b>=1&&10>b)switch(a){case c.MODE_NUMBER:return 10;case c.MODE_ALPHA_NUM:return 9;case c.MODE_8BIT_BYTE:return 8;case c.MODE_KANJI:return 8;default:throw new Error("mode:"+a)}else if(27>b)switch(a){case c.MODE_NUMBER:return 12;case c.MODE_ALPHA_NUM:return 11;case c.MODE_8BIT_BYTE:return 16;case c.MODE_KANJI:return 10;default:throw new Error("mode:"+a)}else{if(!(41>b))throw new Error("type:"+b);switch(a){case c.MODE_NUMBER:return 14;case c.MODE_ALPHA_NUM:return 13;case c.MODE_8BIT_BYTE:return 16;case c.MODE_KANJI:return 12;default:throw new Error("mode:"+a)}}},getLostPoint:function(a){for(var b=a.getModuleCount(),c=0,d=0;b>d;d++)for(var e=0;b>e;e++){for(var f=0,g=a.isDark(d,e),h=-1;1>=h;h++)if(!(0>d+h||d+h>=b))for(var i=-1;1>=i;i++)0>e+i||e+i>=b||(0!=h||0!=i)&&g==a.isDark(d+h,e+i)&&f++;f>5&&(c+=3+f-5)}for(var d=0;b-1>d;d++)for(var e=0;b-1>e;e++){var j=0;a.isDark(d,e)&&j++,a.isDark(d+1,e)&&j++,a.isDark(d,e+1)&&j++,a.isDark(d+1,e+1)&&j++,(0==j||4==j)&&(c+=3)}for(var d=0;b>d;d++)for(var e=0;b-6>e;e++)a.isDark(d,e)&&!a.isDark(d,e+1)&&a.isDark(d,e+2)&&a.isDark(d,e+3)&&a.isDark(d,e+4)&&!a.isDark(d,e+5)&&a.isDark(d,e+6)&&(c+=40);for(var e=0;b>e;e++)for(var d=0;b-6>d;d++)a.isDark(d,e)&&!a.isDark(d+1,e)&&a.isDark(d+2,e)&&a.isDark(d+3,e)&&a.isDark(d+4,e)&&!a.isDark(d+5,e)&&a.isDark(d+6,e)&&(c+=40);for(var k=0,e=0;b>e;e++)for(var d=0;b>d;d++)a.isDark(d,e)&&k++;var l=Math.abs(100*k/b/b-50)/5;return c+=10*l}},g={glog:function(a){if(1>a)throw new Error("glog("+a+")");return g.LOG_TABLE[a]},gexp:function(a){for(;0>a;)a+=255;for(;a>=256;)a-=255;return g.EXP_TABLE[a]},EXP_TABLE:new Array(256),LOG_TABLE:new Array(256)},h=0;8>h;h++)g.EXP_TABLE[h]=1<<h;for(var h=8;256>h;h++)g.EXP_TABLE[h]=g.EXP_TABLE[h-4]^g.EXP_TABLE[h-5]^g.EXP_TABLE[h-6]^g.EXP_TABLE[h-8];for(var h=0;255>h;h++)g.LOG_TABLE[g.EXP_TABLE[h]]=h;i.prototype={get:function(a){return this.num[a]},getLength:function(){return this.num.length},multiply:function(a){for(var b=new Array(this.getLength()+a.getLength()-1),c=0;c<this.getLength();c++)for(var d=0;d<a.getLength();d++)b[c+d]^=g.gexp(g.glog(this.get(c))+g.glog(a.get(d)));return new i(b,0)},mod:function(a){if(this.getLength()-a.getLength()<0)return this;for(var b=g.glog(this.get(0))-g.glog(a.get(0)),c=new Array(this.getLength()),d=0;d<this.getLength();d++)c[d]=this.get(d);for(var d=0;d<a.getLength();d++)c[d]^=g.gexp(g.glog(a.get(d))+b);return new i(c,0).mod(a)}},j.RS_BLOCK_TABLE=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]],j.getRSBlocks=function(a,b){var c=j.getRsBlockTable(a,b);if(void 0==c)throw new Error("bad rs block @ typeNumber:"+a+"/errorCorrectLevel:"+b);for(var d=c.length/3,e=[],f=0;d>f;f++)for(var g=c[3*f+0],h=c[3*f+1],i=c[3*f+2],k=0;g>k;k++)e.push(new j(h,i));return e},j.getRsBlockTable=function(a,b){switch(b){case d.L:return j.RS_BLOCK_TABLE[4*(a-1)+0];case d.M:return j.RS_BLOCK_TABLE[4*(a-1)+1];case d.Q:return j.RS_BLOCK_TABLE[4*(a-1)+2];case d.H:return j.RS_BLOCK_TABLE[4*(a-1)+3];default:return void 0}},k.prototype={get:function(a){var b=Math.floor(a/8);return 1==(1&this.buffer[b]>>>7-a%8)},put:function(a,b){for(var c=0;b>c;c++)this.putBit(1==(1&a>>>b-c-1))},getLengthInBits:function(){return this.length},putBit:function(a){var b=Math.floor(this.length/8);this.buffer.length<=b&&this.buffer.push(0),a&&(this.buffer[b]|=128>>>this.length%8),this.length++}};var l=[[17,14,11,7],[32,26,20,14],[53,42,32,24],[78,62,46,34],[106,84,60,44],[134,106,74,58],[154,122,86,64],[192,152,108,84],[230,180,130,98],[271,213,151,119],[321,251,177,137],[367,287,203,155],[425,331,241,177],[458,362,258,194],[520,412,292,220],[586,450,322,250],[644,504,364,280],[718,560,394,310],[792,624,442,338],[858,666,482,382],[929,711,509,403],[1003,779,565,439],[1091,857,611,461],[1171,911,661,511],[1273,997,715,535],[1367,1059,751,593],[1465,1125,805,625],[1528,1190,868,658],[1628,1264,908,698],[1732,1370,982,742],[1840,1452,1030,790],[1952,1538,1112,842],[2068,1628,1168,898],[2188,1722,1228,958],[2303,1809,1283,983],[2431,1911,1351,1051],[2563,1989,1423,1093],[2699,2099,1499,1139],[2809,2213,1579,1219],[2953,2331,1663,1273]],o=function(){var a=function(a,b){this._el=a,this._htOption=b};return a.prototype.draw=function(a){function g(a,b){var c=document.createElementNS("http://www.w3.org/2000/svg",a);for(var d in b)b.hasOwnProperty(d)&&c.setAttribute(d,b[d]);return c}var b=this._htOption,c=this._el,d=a.getModuleCount();Math.floor(b.width/d),Math.floor(b.height/d),this.clear();var h=g("svg",{viewBox:"0 0 "+String(d)+" "+String(d),width:"100%",height:"100%",fill:b.colorLight});h.setAttributeNS("http://www.w3.org/2000/xmlns/","xmlns:xlink","http://www.w3.org/1999/xlink"),c.appendChild(h),h.appendChild(g("rect",{fill:b.colorDark,width:"1",height:"1",id:"template"}));for(var i=0;d>i;i++)for(var j=0;d>j;j++)if(a.isDark(i,j)){var k=g("use",{x:String(i),y:String(j)});k.setAttributeNS("http://www.w3.org/1999/xlink","href","#template"),h.appendChild(k)}},a.prototype.clear=function(){for(;this._el.hasChildNodes();)this._el.removeChild(this._el.lastChild)},a}(),p="svg"===document.documentElement.tagName.toLowerCase(),q=p?o:m()?function(){function a(){this._elImage.src=this._elCanvas.toDataURL("image/png"),this._elImage.style.display="block",this._elCanvas.style.display="none"}function d(a,b){var c=this;if(c._fFail=b,c._fSuccess=a,null===c._bSupportDataURI){var d=document.createElement("img"),e=function(){c._bSupportDataURI=!1,c._fFail&&_fFail.call(c)},f=function(){c._bSupportDataURI=!0,c._fSuccess&&c._fSuccess.call(c)};return d.onabort=e,d.onerror=e,d.onload=f,d.src="data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",void 0}c._bSupportDataURI===!0&&c._fSuccess?c._fSuccess.call(c):c._bSupportDataURI===!1&&c._fFail&&c._fFail.call(c)}if(this._android&&this._android<=2.1){var b=1/window.devicePixelRatio,c=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(a,d,e,f,g,h,i,j){if("nodeName"in a&&/img/i.test(a.nodeName))for(var l=arguments.length-1;l>=1;l--)arguments[l]=arguments[l]*b;else"undefined"==typeof j&&(arguments[1]*=b,arguments[2]*=b,arguments[3]*=b,arguments[4]*=b);c.apply(this,arguments)}}var e=function(a,b){this._bIsPainted=!1,this._android=n(),this._htOption=b,this._elCanvas=document.createElement("canvas"),this._elCanvas.width=b.width,this._elCanvas.height=b.height,a.appendChild(this._elCanvas),this._el=a,this._oContext=this._elCanvas.getContext("2d"),this._bIsPainted=!1,this._elImage=document.createElement("img"),this._elImage.style.display="none",this._el.appendChild(this._elImage),this._bSupportDataURI=null};return e.prototype.draw=function(a){var b=this._elImage,c=this._oContext,d=this._htOption,e=a.getModuleCount(),f=d.width/e,g=d.height/e,h=Math.round(f),i=Math.round(g);b.style.display="none",this.clear();for(var j=0;e>j;j++)for(var k=0;e>k;k++){var l=a.isDark(j,k),m=k*f,n=j*g;c.strokeStyle=l?d.colorDark:d.colorLight,c.lineWidth=1,c.fillStyle=l?d.colorDark:d.colorLight,c.fillRect(m,n,f,g),c.strokeRect(Math.floor(m)+.5,Math.floor(n)+.5,h,i),c.strokeRect(Math.ceil(m)-.5,Math.ceil(n)-.5,h,i)}this._bIsPainted=!0},e.prototype.makeImage=function(){this._bIsPainted&&d.call(this,a)},e.prototype.isPainted=function(){return this._bIsPainted},e.prototype.clear=function(){this._oContext.clearRect(0,0,this._elCanvas.width,this._elCanvas.height),this._bIsPainted=!1},e.prototype.round=function(a){return a?Math.floor(1e3*a)/1e3:a},e}():function(){var a=function(a,b){this._el=a,this._htOption=b};return a.prototype.draw=function(a){for(var b=this._htOption,c=this._el,d=a.getModuleCount(),e=Math.floor(b.width/d),f=Math.floor(b.height/d),g=['<table style="border:0;border-collapse:collapse;">'],h=0;d>h;h++){g.push("<tr>");for(var i=0;d>i;i++)g.push('<td style="border:0;border-collapse:collapse;padding:0;margin:0;width:'+e+"px;height:"+f+"px;background-color:"+(a.isDark(h,i)?b.colorDark:b.colorLight)+';"></td>');g.push("</tr>")}g.push("</table>"),c.innerHTML=g.join("");var j=c.childNodes[0],k=(b.width-j.offsetWidth)/2,l=(b.height-j.offsetHeight)/2;k>0&&l>0&&(j.style.margin=l+"px "+k+"px")},a.prototype.clear=function(){this._el.innerHTML=""},a}();QRCode=function(a,b){if(this._htOption={width:256,height:256,typeNumber:4,colorDark:"#000000",colorLight:"#ffffff",correctLevel:d.H},"string"==typeof b&&(b={text:b}),b)for(var c in b)this._htOption[c]=b[c];"string"==typeof a&&(a=document.getElementById(a)),this._android=n(),this._el=a,this._oQRCode=null,this._oDrawing=new q(this._el,this._htOption),this._htOption.text&&this.makeCode(this._htOption.text)},QRCode.prototype.makeCode=function(a){this._oQRCode=new b(r(a,this._htOption.correctLevel),this._htOption.correctLevel),this._oQRCode.addData(a),this._oQRCode.make(),this._el.title=a,this._oDrawing.draw(this._oQRCode),this.makeImage()},QRCode.prototype.makeImage=function(){"function"==typeof this._oDrawing.makeImage&&(!this._android||this._android>=3)&&this._oDrawing.makeImage()},QRCode.prototype.clear=function(){this._oDrawing.clear()},QRCode.CorrectLevel=d}();]]>
				</script>
				<style type="text/css">
					body {
					    background-color: #FFFFFF;
					    font-family: 'Tahoma', "Times New Roman", Times, serif;
					    font-size: 11px;
					    color: #666666;
					}
					h1, h2 {
					    padding-bottom: 3px;
					    padding-top: 3px;
					    margin-bottom: 5px;
					    text-transform: uppercase;
					    font-family: Arial, Helvetica, sans-serif;
					}
					h1 {
					    font-size: 1.4em;
					    text-transform:none;
					}
					h2 {
					    font-size: 1em;
					    color: brown;
					}
					h3 {
					    font-size: 1em;
					    color: #333333;
					    text-align: justify;
					    margin: 0;
					    padding: 0;
					}
					h4 {
					    font-size: 1.1em;
					    font-style: bold;
					    font-family: Arial, Helvetica, sans-serif;
					    color: #000000;
					    margin: 0;
					    padding: 0;
					}
					hr {
					    height:2px;
					    color: #000000;
					    background-color: #000000;
					    border-bottom: 1px solid #000000;
					}
					p, ul, ol {
					    margin-top: 1.5em;
					}
					ul, ol {
					    margin-left: 3em;
					}
					blockquote {
					    margin-left: 3em;
					    margin-right: 3em;
					    font-style: italic;
					}
					a {
					    text-decoration: none;
					    color: #70A300;
					}
					a:hover {
					    border: none;
					    color: #70A300;
					}
					#despatchTable {
					    border-collapse:collapse;
					    font-size:11px;
					    float:right;
					    border-color:gray;
					}
					#ettnTable {
					    border-collapse:collapse;
					    font-size:11px;
					    border-color:gray;
					}
					#customerPartyTable {
					    border-width: 0px;
					    border-spacing:;
					    border-color: gray;
					    border-collapse: collapse;
					    background-color:
					}
					#customerIDTable {
					    border-width: 2px;
					    border-spacing:;
					    border-style: inset;
					    border-color: gray;
					    border-collapse: collapse;
					    background-color:
					}
					#customerIDTableTd {
					    border-width: 2px;
					    border-spacing:;
					    border-style: inset;
					    border-color: gray;
					    border-collapse: collapse;
					    background-color:
					}
					#lineTable {
					    border-width:2px;
					    border-spacing:;
					    border-color: black;
					    border-collapse: collapse;
					    background-color:;
					}
					td.lineTableTd {
					    border-width: 1px;
					    padding: 1px;
					    border-style: inset;
					    background-color: white;
					}
					tr.lineTableTr {
					    border-width: 1px;
					    padding: 0px;
					    border-color: black;
					    background-color: white;
					    -moz-border-radius:;
					}
					#lineTableDummyTd {
					    border-width: 1px;
					    border-color:white;
					    padding: 1px;
					    border-color: black;
					    background-color: white;
					}
					td.lineTableBudgetTd {
					    border-width: 2px;
					    border-spacing:0px;
					    padding: 1px;
					    border-style: inset;
					    border-color: black;
					    background-color: white;
					    -moz-border-radius:;
					}
					#notesTable {
					    border-width: 2px;
					    border-spacing:;
					    border-style: inset;
					    border-color: black;
					    border-collapse: collapse;
					    background-color:
					}
					#notesTableTd {
					    border-width: 0px;
					    border-spacing:;
					    border-style: inset;
					    border-color: black;
					    border-collapse: collapse;
					    background-color:
					}
					table {
					    border-spacing:0px;
					}
					#budgetContainerTable {
					    border-width: 0px;
					    border-spacing: 0px;
					    border-color: black;
					    border-collapse: collapse;
					    background-color:;
					}
					td {
					    border-color:gray;
					}
      </style>
				<title>e-Fatura</title>
			</head>
			<body  style="margin-left=0.6in; margin-right=0.6in; margin-top=0.7in; margin-bottom=0.79in">
			
				<xsl:for-each select="$XML">
					<table style="border-color:blue; " border="0" cellspacing="0px" width="800"
						cellpadding="px">
						<tbody>
						<tr border="1">
				<td colspan="3">
						<img style="width:620px; height:140px;" align="middle" src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAgEAlgCWAAD/7QAsUGhvdG9zaG9wIDMuMAA4QklNA+0AAAAAABAAlgAAAAEAAQCWAAAAAQAB/+E44mh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8APD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgOS4xLWMwMDEgNzkuYThkNDc1MywgMjAyMy8wMy8yMy0wODo1NjozNyAgICAgICAgIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgICAgICAgICB4bWxuczp4bXBHSW1nPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvZy9pbWcvIgogICAgICAgICAgICB4bWxuczpwZGY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGRmLzEuMy8iCiAgICAgICAgICAgIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIKICAgICAgICAgICAgeG1sbnM6aWxsdXN0cmF0b3I9Imh0dHA6Ly9ucy5hZG9iZS5jb20vaWxsdXN0cmF0b3IvMS4wLyIKICAgICAgICAgICAgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICAgICAgICAgIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIgogICAgICAgICAgICB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIj4KICAgICAgICAgPHhtcDpDcmVhdGVEYXRlPjIwMjMtMDgtMjFUMjE6NTg6MzkrMDM6MDA8L3htcDpDcmVhdGVEYXRlPgogICAgICAgICA8eG1wOk1vZGlmeURhdGU+MjAyMy0wOC0yMVQxODo1ODo0NFo8L3htcDpNb2RpZnlEYXRlPgogICAgICAgICA8eG1wOkNyZWF0b3JUb29sPkFkb2JlIElsbHVzdHJhdG9yIDI3LjcgKE1hY2ludG9zaCk8L3htcDpDcmVhdG9yVG9vbD4KICAgICAgICAgPHhtcDpNZXRhZGF0YURhdGU+MjAyMy0wOC0yMVQyMTo1ODozOSswMzowMDwveG1wOk1ldGFkYXRhRGF0ZT4KICAgICAgICAgPHhtcDpUaHVtYm5haWxzPgogICAgICAgICAgICA8cmRmOkFsdD4KICAgICAgICAgICAgICAgPHJkZjpsaSByZGY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAgICAgICAgICAgIDx4bXBHSW1nOndpZHRoPjI1NjwveG1wR0ltZzp3aWR0aD4KICAgICAgICAgICAgICAgICAgPHhtcEdJbWc6aGVpZ2h0PjY0PC94bXBHSW1nOmhlaWdodD4KICAgICAgICAgICAgICAgICAgPHhtcEdJbWc6Zm9ybWF0PkpQRUc8L3htcEdJbWc6Zm9ybWF0PgogICAgICAgICAgICAgICAgICA8eG1wR0ltZzppbWFnZT4vOWovNEFBUVNrWkpSZ0FCQWdFQVNBQklBQUQvN1FBc1VHaHZkRzl6YUc5d0lETXVNQUE0UWtsTkErMEFBQUFBQUJBQVNBQUFBQUVBJiN4QTtBUUJJQUFBQUFRQUIvK0lNV0VsRFExOVFVazlHU1V4RkFBRUJBQUFNU0V4cGJtOENFQUFBYlc1MGNsSkhRaUJZV1ZvZ0I4NEFBZ0FKJiN4QTtBQVlBTVFBQVlXTnpjRTFUUmxRQUFBQUFTVVZESUhOU1IwSUFBQUFBQUFBQUFBQUFBQUFBQVBiV0FBRUFBQUFBMHkxSVVDQWdBQUFBJiN4QTtBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQVJZM0J5ZEFBQUFWQUFBQUF6JiN4QTtaR1Z6WXdBQUFZUUFBQUJzZDNSd2RBQUFBZkFBQUFBVVltdHdkQUFBQWdRQUFBQVVjbGhaV2dBQUFoZ0FBQUFVWjFoWldnQUFBaXdBJiN4QTtBQUFVWWxoWldnQUFBa0FBQUFBVVpHMXVaQUFBQWxRQUFBQndaRzFrWkFBQUFzUUFBQUNJZG5WbFpBQUFBMHdBQUFDR2RtbGxkd0FBJiN4QTtBOVFBQUFBa2JIVnRhUUFBQS9nQUFBQVViV1ZoY3dBQUJBd0FBQUFrZEdWamFBQUFCREFBQUFBTWNsUlNRd0FBQkR3QUFBZ01aMVJTJiN4QTtRd0FBQkR3QUFBZ01ZbFJTUXdBQUJEd0FBQWdNZEdWNGRBQUFBQUJEYjNCNWNtbG5hSFFnS0dNcElERTVPVGdnU0dWM2JHVjBkQzFRJiN4QTtZV05yWVhKa0lFTnZiWEJoYm5rQUFHUmxjMk1BQUFBQUFBQUFFbk5TUjBJZ1NVVkROakU1TmpZdE1pNHhBQUFBQUFBQUFBQUFBQUFTJiN4QTtjMUpIUWlCSlJVTTJNVGsyTmkweUxqRUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBJiN4QTtBQUFBQUFBQUFBQUFBRmhaV2lBQUFBQUFBQUR6VVFBQkFBQUFBUmJNV0ZsYUlBQUFBQUFBQUFBQUFBQUFBQUFBQUFCWVdWb2dBQUFBJiN4QTtBQUFBYjZJQUFEajFBQUFEa0ZoWldpQUFBQUFBQUFCaW1RQUF0NFVBQUJqYVdGbGFJQUFBQUFBQUFDU2dBQUFQaEFBQXRzOWtaWE5qJiN4QTtBQUFBQUFBQUFCWkpSVU1nYUhSMGNEb3ZMM2QzZHk1cFpXTXVZMmdBQUFBQUFBQUFBQUFBQUJaSlJVTWdhSFIwY0RvdkwzZDNkeTVwJiN4QTtaV011WTJnQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQVpHVnpZd0FBJiN4QTtBQUFBQUFBdVNVVkRJRFl4T1RZMkxUSXVNU0JFWldaaGRXeDBJRkpIUWlCamIyeHZkWElnYzNCaFkyVWdMU0J6VWtkQ0FBQUFBQUFBJiN4QTtBQUFBQUFBdVNVVkRJRFl4T1RZMkxUSXVNU0JFWldaaGRXeDBJRkpIUWlCamIyeHZkWElnYzNCaFkyVWdMU0J6VWtkQ0FBQUFBQUFBJiN4QTtBQUFBQUFBQUFBQUFBQUFBQUFBQUFHUmxjMk1BQUFBQUFBQUFMRkpsWm1WeVpXNWpaU0JXYVdWM2FXNW5JRU52Ym1ScGRHbHZiaUJwJiN4QTtiaUJKUlVNMk1UazJOaTB5TGpFQUFBQUFBQUFBQUFBQUFDeFNaV1psY21WdVkyVWdWbWxsZDJsdVp5QkRiMjVrYVhScGIyNGdhVzRnJiN4QTtTVVZETmpFNU5qWXRNaTR4QUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUIyYVdWM0FBQUFBQUFUcFA0QUZGOHVBQkRQJiN4QTtGQUFEN2N3QUJCTUxBQU5jbmdBQUFBRllXVm9nQUFBQUFBQk1DVllBVUFBQUFGY2Y1MjFsWVhNQUFBQUFBQUFBQVFBQUFBQUFBQUFBJiN4QTtBQUFBQUFBQUFBQUFBQUtQQUFBQUFuTnBaeUFBQUFBQVExSlVJR04xY25ZQUFBQUFBQUFFQUFBQUFBVUFDZ0FQQUJRQUdRQWVBQ01BJiN4QTtLQUF0QURJQU53QTdBRUFBUlFCS0FFOEFWQUJaQUY0QVl3Qm9BRzBBY2dCM0FId0FnUUNHQUlzQWtBQ1ZBSm9BbndDa0FLa0FyZ0N5JiN4QTtBTGNBdkFEQkFNWUF5d0RRQU5VQTJ3RGdBT1VBNndEd0FQWUErd0VCQVFjQkRRRVRBUmtCSHdFbEFTc0JNZ0U0QVQ0QlJRRk1BVklCJiN4QTtXUUZnQVdjQmJnRjFBWHdCZ3dHTEFaSUJtZ0doQWFrQnNRRzVBY0VCeVFIUkFka0I0UUhwQWZJQitnSURBZ3dDRkFJZEFpWUNMd0k0JiN4QTtBa0VDU3dKVUFsMENad0p4QW5vQ2hBS09BcGdDb2dLc0FyWUN3UUxMQXRVQzRBTHJBdlVEQUFNTEF4WURJUU10QXpnRFF3TlBBMW9EJiN4QTtaZ055QTM0RGlnT1dBNklEcmdPNkE4Y0Qwd1BnQSt3RCtRUUdCQk1FSUFRdEJEc0VTQVJWQkdNRWNRUitCSXdFbWdTb0JMWUV4QVRUJiN4QTtCT0VFOEFUK0JRMEZIQVVyQlRvRlNRVllCV2NGZHdXR0JaWUZwZ1cxQmNVRjFRWGxCZllHQmdZV0JpY0dOd1pJQmxrR2FnWjdCb3dHJiN4QTtuUWF2QnNBRzBRYmpCdlVIQndjWkJ5c0hQUWRQQjJFSGRBZUdCNWtIckFlL0I5SUg1UWY0Q0FzSUh3Z3lDRVlJV2dodUNJSUlsZ2lxJiN4QTtDTDRJMGdqbkNQc0pFQWtsQ1RvSlR3bGtDWGtKandta0Nib0p6d25sQ2ZzS0VRb25DajBLVkFwcUNvRUttQXF1Q3NVSzNBcnpDd3NMJiN4QTtJZ3M1QzFFTGFRdUFDNWdMc0F2SUMrRUwrUXdTRENvTVF3eGNESFVNamd5bkRNQU0yUXp6RFEwTkpnMUFEVm9OZEEyT0Rha053dzNlJiN4QTtEZmdPRXc0dURra09aQTUvRHBzT3RnN1NEdTRQQ1E4bEQwRVBYZzk2RDVZUHN3L1BEK3dRQ1JBbUVFTVFZUkIrRUpzUXVSRFhFUFVSJiN4QTtFeEV4RVU4UmJSR01FYW9SeVJIb0VnY1NKaEpGRW1RU2hCS2pFc01TNHhNREV5TVRReE5qRTRNVHBCUEZFK1VVQmhRbkZFa1VhaFNMJiN4QTtGSzBVemhUd0ZSSVZOQlZXRlhnVm14VzlGZUFXQXhZbUZra1diQmFQRnJJVzFoYjZGeDBYUVJkbEY0a1hyaGZTRi9jWUd4aEFHR1VZJiN4QTtpaGl2R05VWStoa2dHVVVaYXhtUkdiY1ozUm9FR2lvYVVScDNHcDRheFJyc0d4UWJPeHRqRzRvYnNodmFIQUljS2h4U0hIc2NveHpNJiN4QTtIUFVkSGgxSEhYQWRtUjNESGV3ZUZoNUFIbW9lbEI2K0h1a2ZFeDgrSDJrZmxCKy9IK29nRlNCQklHd2dtQ0RFSVBBaEhDRklJWFVoJiN4QTtvU0hPSWZzaUp5SlZJb0lpcnlMZEl3b2pPQ05tSTVRandpUHdKQjhrVFNSOEpLc2syaVVKSlRnbGFDV1hKY2NsOXlZbkpsY21oeWEzJiN4QTtKdWduR0NkSkozb25xeWZjS0Ewb1B5aHhLS0lvMUNrR0tUZ3BheW1kS2RBcUFpbzFLbWdxbXlyUEt3SXJOaXRwSzUwcjBTd0ZMRGtzJiN4QTtiaXlpTE5jdERDMUJMWFl0cXkzaExoWXVUQzZDTHJjdTdpOGtMMW92a1MvSEwvNHdOVEJzTUtRdzJ6RVNNVW94Z2pHNk1mSXlLakpqJiN4QTtNcHN5MURNTk0wWXpmek80TS9FMEt6UmxOSjQwMkRVVE5VMDFoelhDTmYwMk56WnlOcTQyNlRja04yQTNuRGZYT0JRNFVEaU1PTWc1JiN4QTtCVGxDT1g4NXZEbjVPalk2ZERxeU91ODdMVHRyTzZvNzZEd25QR1U4cER6alBTSTlZVDJoUGVBK0lENWdQcUErNEQ4aFAyRS9vai9pJiN4QTtRQ05BWkVDbVFPZEJLVUZxUWF4QjdrSXdRbkpDdFVMM1F6cERmVVBBUkFORVIwU0tSTTVGRWtWVlJacEYza1lpUm1kR3EwYndSelZIJiN4QTtlMGZBU0FWSVMwaVJTTmRKSFVsalNhbEo4RW8zU24xS3hFc01TMU5MbWt2aVRDcE1ja3k2VFFKTlNrMlRUZHhPSlU1dVRyZFBBRTlKJiN4QTtUNU5QM1ZBblVIRlF1MUVHVVZCUm0xSG1VakZTZkZMSFV4TlRYMU9xVS9aVVFsU1BWTnRWS0ZWMVZjSldEMVpjVnFsVzkxZEVWNUpYJiN4QTs0Rmd2V0gxWXkxa2FXV2xadUZvSFdsWmFwbHIxVzBWYmxWdmxYRFZjaGx6V1hTZGRlRjNKWGhwZWJGNjlYdzlmWVYrellBVmdWMkNxJiN4QTtZUHhoVDJHaVlmVmlTV0tjWXZCalEyT1hZK3RrUUdTVVpPbGxQV1dTWmVkbVBXYVNadWhuUFdlVForbG9QMmlXYU94cFEybWFhZkZxJiN4QTtTR3FmYXZkclQydW5hLzlzVjJ5dmJRaHRZRzI1YmhKdWEyN0VieDV2ZUcvUmNDdHdobkRnY1RweGxYSHdja3R5cG5NQmMxMXp1SFFVJiN4QTtkSEIwekhVb2RZVjE0WFkrZHB0MitIZFdkN040RVhodWVNeDVLbm1KZWVkNlJucWxld1I3WTN2Q2ZDRjhnWHpoZlVGOW9YNEJmbUorJiN4QTt3bjhqZjRSLzVZQkhnS2lCQ29GcmdjMkNNSUtTZ3ZTRFY0TzZoQjJFZ0lUamhVZUZxNFlPaG5LRzE0YzdoNStJQklocGlNNkpNNG1aJiN4QTtpZjZLWklyS2l6Q0xsb3Y4akdPTXlvMHhqWmlOLzQ1bWpzNlBObytla0FhUWJwRFdrVCtScUpJUmtucVM0NU5OazdhVUlKU0tsUFNWJiN4QTtYNVhKbGpTV241Y0tsM1dYNEpoTW1MaVpKSm1RbWZ5YWFKclZtMEticjV3Y25JbWM5NTFrbmRLZVFKNnVueDJmaTUvNm9HbWcyS0ZIJiN4QTtvYmFpSnFLV293YWpkcVBtcEZha3g2VTRwYW1tR3FhTHB2Mm5icWZncUZLb3hLazNxYW1xSEtxUHF3S3JkYXZwckZ5czBLMUVyYml1JiN4QTtMYTZocnhhdmk3QUFzSFd3NnJGZ3NkYXlTN0xDc3ppenJyUWx0SnkxRTdXS3RnRzJlYmJ3dDJpMzRMaFp1Tkc1U3JuQ3VqdTZ0YnN1JiN4QTt1NmU4SWJ5YnZSVzlqNzRLdm9TKy83OTZ2L1hBY01Ec3dXZkI0OEpmd3R2RFdNUFV4RkhFenNWTHhjakdSc2JEeDBISHY4Zzl5THpKJiN4QTtPc201eWpqS3Q4czJ5N2JNTmN5MXpUWE50YzQyenJiUE44KzQwRG5RdXRFODBiN1NQOUxCMDBUVHh0UkoxTXZWVHRYUjFsWFcyTmRjJiN4QTsxK0RZWk5qbzJXelo4ZHAyMnZ2YmdOd0YzSXJkRU4yVzNoemVvdDhwMzYvZ051Qzk0VVRoek9KVDR0dmpZK1ByNUhQay9PV0U1ZzNtJiN4QTtsdWNmNTZub011aTg2VWJwME9wYjZ1WHJjT3Y3N0lidEVlMmM3aWp1dE85QTc4endXUERsOFhMeC8vS004eG56cC9RMDlNTDFVUFhlJiN4QTs5bTMyKy9lSytCbjRxUGs0K2NmNlYvcm4rM2Y4Qi95WS9Tbjl1djVML3R6L2JmLy8vKzRBRGtGa2IySmxBR1RBQUFBQUFmL2JBSVFBJiN4QTtCZ1FFQkFVRUJnVUZCZ2tHQlFZSkN3Z0dCZ2dMREFvS0N3b0tEQkFNREF3TURBd1FEQTRQRUE4T0RCTVRGQlFURXh3Ykd4c2NIeDhmJiN4QTtIeDhmSHg4Zkh3RUhCd2NOREEwWUVCQVlHaFVSRlJvZkh4OGZIeDhmSHg4Zkh4OGZIeDhmSHg4Zkh4OGZIeDhmSHg4Zkh4OGZIeDhmJiN4QTtIeDhmSHg4Zkh4OGZIeDhmSHg4Zi84QUFFUWdBUUFFQUF3RVJBQUlSQVFNUkFmL0VBYUlBQUFBSEFRRUJBUUVBQUFBQUFBQUFBQVFGJiN4QTtBd0lHQVFBSENBa0tDd0VBQWdJREFRRUJBUUVBQUFBQUFBQUFBUUFDQXdRRkJnY0lDUW9MRUFBQ0FRTURBZ1FDQmdjREJBSUdBbk1CJiN4QTtBZ01SQkFBRklSSXhRVkVHRTJFaWNZRVVNcEdoQnhXeFFpUEJVdEhoTXhaaThDUnlndkVsUXpSVGtxS3lZM1BDTlVRbms2T3pOaGRVJiN4QTtaSFREMHVJSUpvTUpDaGdaaEpSRlJxUzBWdE5WS0JyeTQvUEUxT1QwWlhXRmxhVzF4ZFhsOVdaMmhwYW10c2JXNXZZM1IxZG5kNGVYJiN4QTtwN2ZIMStmM09FaFlhSGlJbUtpNHlOam8rQ2s1U1ZscGVZbVpxYm5KMmVuNUtqcEtXbXA2aXBxcXVzcmE2dm9SQUFJQ0FRSURCUVVFJiN4QTtCUVlFQ0FNRGJRRUFBaEVEQkNFU01VRUZVUk5oSWdaeGdaRXlvYkh3Rk1IUjRTTkNGVkppY3ZFekpEUkRnaGFTVXlXaVk3TENCM1BTJiN4QTtOZUpFZ3hkVWt3Z0pDaGdaSmpaRkdpZGtkRlUzOHFPend5Z3AwK1B6aEpTa3RNVFU1UFJsZFlXVnBiWEYxZVgxUmxabWRvYVdwcmJHJiN4QTsxdWIyUjFkbmQ0ZVhwN2ZIMStmM09FaFlhSGlJbUtpNHlOam8rRGxKV1dsNWlabXB1Y25aNmZrcU9rcGFhbnFLbXFxNnl0cnErdi9hJiN4QTtBQXdEQVFBQ0VRTVJBRDhBNmdNMTdoTGhpbGVNVXRqRlY0eFN1R0tyeGhWY01VcmhoVmVNVXJoaFZjTUtyeGlsY01LcnhpcThZVXJoJiN4QTtpcThZcXZHRks4WXF2R0ZWNHdwWGpGVjR3cFhqRlY0d3F2WENsVUdLcjF3cFZCaFZVWENxb01VdktCbUE0UzRZcFhqRkxZeFZlTVVyJiN4QTtoaXE4WVZYREZLNFlWWGpGSzRZVlhEQ3E4WXBYRENxOFlxdkdGSzRZcXZHS3J4aFN2R0tyeGhWZU1LVjR4VmVNS1Y0eFZlTUtyMXdwJiN4QTtWQmlxOWNLVlFZVlZGd3FxREZMeWdaZ09FdUdLVjR4UzJNVlhqRks0WXF2R0ZWd3hTdUdGVjR4U3VHRlZ3d3F2R0tWd3dxdkdLcnhoJiN4QTtTdUdLcnhpcThZVXJ4aXE4WVZYakNsZU1WWGpDbGVNVlhqQ3E5Y0tWUVlxdlhDbFVHRlZSY0txZ3hTOG9HWURoTU84cGVlMzFOcDVkJiN4QTtWbjArenR3NWpnUlhsU1RuNmpJcXVabFNNbHVPd1JqazVScG1Zb2J5L3dEbWphUzJseGYrWUxteTArMEU1dHJaSS9YYVhtSkpFcEp5JiN4QTtUaWFyRnkrQW1ncldtRXc3a21QY25Pay9tTjVYMU8rdWJhMnVTVWdpU2VLNDRTQ09XTm9qTXpJU28rd28zeUpnUXBpVjgzNW1lUmJjJiN4QTt1SnRYaVQwM1dOeVZrb0hkZVlVbmpUN0E1SHdHNTJ4NEN2Q1ZIWGZQbW5XSTh0YW5GZXhKb0dxelNtNHUzQkFhQVdVMDhaV29EQXRKJiN4QTtHdEJTcDZkOElqelNJdCtaZlAyblcra1F5NlRkcTE3Y1hrTnZGSEpHNEpXUFViZXp2QVZkVm9ZL3JISGZ2aGpGUkZTMFA4MHZMSDZPJiN4QTswNkhXZFZoaTFxNHQ0Wko3Y0srenpyeVVmQ3JBRmh2eHJXbS9URXdQUkppV1RhQjVuMEhYNDVwTkl2RnUwdDJWSnVJWlNwZEE2N09GJiN4QTtOR1ZnUWVod0VFSUlwQzNuNWdlVGJIVjVkSHU5VmhpMUtDTnBacmM4aVZWSXpNUVNBVjVlbU9YR3ZLbmJDSWxORkNTL20zK1hVQ2hwJiN4QTt0YmhqRFJpVk9TU2prakVoV1NxZkZ5b1N0UHREY1ZHSGdLOEpWcC96Uy9MK0M0ZTNrMXFEMWtqTXpLb2Qvd0IySURjc3dLcVFhUWprJiN4QTthZE51NUdQQ1Y0U2hwdnpPOHVMcXNNOGVwdy9vQ0cwMUZ0U3VDckF4M1ZwUFl4UnB1T2RhWGgyQStLb3BoNFNta3dYOHovSVpqOVJkJiN4QTtYamRQVG5ucWlTdFNPMVV0T3hBUTBFWVU4dkRwMXg0U3RGWDEzelZEby9talNiSzhuU0N3dnJPOWNncVdra3VZcml5aWdTTUtDekUvJiN4QTtXbitGUnY4QVJpQnNvQ2pGK2EvNWR5UjNFa2V1UU9scTZ4eWxSSTN4T3hST0FDL3ZBenFWQlNvcnRoNFNtaW5tbmVaZEUxRzVqdHJPJiN4QTs2RXM4c1VrNlI4WFVtT0diMEpHK0lEN01vNDQwaE5oZ1ZlTUtWNHhWZU1LcnhoU3ZHS3J4aFN2R0t2SWRkdDliWDg2RHBrWG1MVm90JiN4QTtPYlNHMXo2bkhjQVJDZUtka0VJVGhUMEdFZTY5ZXZ4WkhPYXh5STUwZnVic0lCa0w3d3hqODVmTkhuVFNkSDBPNDByVk5SdEpydHJoJiN4QTtwbUVwVlhXRkZjbGVKcVFvcVRYTUxzc3lsRW1Sa2Jybitoek5jSWlWUkVkdTc5TEROTy9OYjh3SnZMM21BM091WEVOL2YzZW5SV0x2JiN4QTtPMGEyNHVHbW5ZeHN4L2RvVWpBSnJUam0wcHdhZXV4L21kcWgvSjd5M2V3M0R2cStxUXRCTmVzYXZXMGIwcG1MVnJ6ZGdOL21ldE14JiN4QTt0VGtNUlE2dEdhVmNucXZsRFhoci9sdXcxY0o2YlhVZktSQldna1VsSEMxN2NsTlBiTG9Tc1d6aEt4YWRyazJTb01VdktCbUE0U1Q2JiN4QTtGNVlUU1l6Yi9wQzV2cklFbUMwdWx0akhDUzVlcU5GREZJZDIvYlpzSmxiSW0wRmMvbDdwczJqNmZwc0Y3ZVdiYVhjeVhkbmV3U0l0JiN4QTt3cnpHVDFGcVVLRU1zN0w5bnBoNDkwOFNYTitUdWhMcHNOamFhbHFObVlGRVNYTVVzWWxNWHBOQThaL2Q4U0hqa05kcTFvUmt2RUxMJiN4QTtqVEM3L0xMUkpyV0dHM3VyeXdrZ3VwTHVHNXRwRVdWVFBEOVhsanF5TUNyUmZEVWprUEhBSmxlSlV2UHl5OHYzdWdhTG9jMDExOVYwJiN4QTtHaHNKVmtSWmVhd3RESEl6QlB0eDgrYWxRUGlBN2JZaVp1MTRrTXY1UzZLYjZhN24xRy91UFVsRnhGREk4UENLWnJ1QzluZU1DSVVNJiN4QTs4OXFoZjZhVXJzZU1yeEtUL2t0NWRlVkNOUjFKTFpXdHBYdEZsaTlKNTdTSDZ2SE13TVIrTDB2aE5LRHZTdUh4Q25qWkRaZVZHMDIvJiN4QTt0cGRNdW5ndFI2SzMwVEJDWklyVzJhQ0dOYUtBb3FRem4vSjJwZzRrV2x1cWZsUG9XcDZyZDNzMTdleDIxN0k5ek5wc2NpQzMrdHlXJiN4QTs1dGpjcUNqTUg5TnVuTGpYY2pDSmxQRW1OeCtYdWhYRjdGZHUweXlReXdUSXFtTUxXMnRaYlNOU09CK0gwN2hqVCthbnl4RWx0STV2JiN4QTt5Tjh0U3FZVHFXcHJZbEhWYkpab3ZTRWsxa2JDV2FqUk44YlJVUGdHNkNoSXlYR1U4U2I2MytWbmwvVjdtOHVwWjdxM3VMcDJsVjdkJiN4QTs0MDlHVWl4Q3ZFREdhRkRwVVJGYTlXcjFIRUNTZ3RXUDVVNkRhMk9xV3JYZDdjUHE5cmQyZDdkVFBFWlN0K3hlZDFJaVVCeXhxTnFlJiN4QTsySGlXMDE4eitSdEo4eFgrbmFoZHpYRnZlNlNzbzArZTJkRmFOcDNoZDMrTkhESGpiOEtNQ3BWbUJCcnNBYVVGSjlEL0FDZDh2YVhlJiN4QTsyMTBMNi91L3FCaFhTNHJtU04wdG9MZVZwbzRFL2RnbEJJM1ZpV29GQU8yUzRrMm0vbHI4dnRPMEhYYjNXSWIyOHVwTHBaSTRMYTVrJiN4QTtWb2JhS2VkcnFWSVFxcWFOTTVQeEVtbEIyd0UydHNyR0JDOFlVcnhpcThZVlhqQ2xlTVZYakNsZU1WZWIza092Nmw1b2J6RFllVm1XJiN4QTsvVzBiVEV1YnlabzYycGtaNkdJdEV0U3pWN24zekduT2NnUUk3Tkl6Wkx1SVFHcitRUE5ldG0xZS93QklzSzJucStpbnJUQUQxMDlPJiN4QTtTb0V4QjVLY3F3NGNtUDZRQmJaazFHZWZPa3FUOHBkU3RMMkM4L3dwWlhSdHpiRVIvV0pIalkyY1hvd2w0NUxqaTN3ZFFWMzc1ZjRtJiN4QTtidUg0K0xWeDVlNEp6b3Y1ZUpxM2w1ZkxYNkluOHR3YVpJMXhaM1R0SmNJV3VHckpHcVNsU1FhY3RuMlA0aXBaTnBDcVVHVStZcDZwJiN4QTs1ZDBTMDBMUmJUU2JRc2JlMFRnck9hc3hKTE14OTJZazVsUmpRcHZpS0ZKb3VUWktneFM4b0dZRGhMaGlsZU1VdGpGVjR4U3VHS3J4JiN4QTtoVmNNVXJoaFZlTVVyaGhWY01LcnhpbGNNS3J4aXE4WVVyaGlxOFlxdkdGSzhZcXZHRlY0d3BYakZWNHdwWGpGVjR3cXZYQ2xVR0tyJiN4QTsxd3BWQmhWVVhDcW9NVXZLQm1BNFM0WXBYakZMWXhWZU1VcmhpcThZVlhERks0WVZYakZLNFlWWERDcThZcFhEQ3E4WXF2R0ZLNFlxJiN4QTt2R0tyeGhTdkdLcnhoVmVNS1Y0eFZlTUtWNHhWZU1LcjF3cFZCaXE5Y0tWUVlWVkZ3cXFERkx5Z1pnT0V1R0tWNHhTMk1WWGpGSzRZJiN4QTtxdkdGVnd4U3VHRlY0eFN1R0ZWd3dxdkdLVnd3cXZHS3J4aFN1R0tyeGlxOFlVcnhpcThZVlhqQ2xlTVZYakNsZU1WWGpDcTljS1ZRJiN4QTtZcXZYQ2xVR0ZWUmNLcWd4Uy8vWjwveG1wR0ltZzppbWFnZT4KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgIDwvcmRmOkFsdD4KICAgICAgICAgPC94bXA6VGh1bWJuYWlscz4KICAgICAgICAgPHBkZjpQcm9kdWNlcj5BZG9iZSBQREYgbGlicmFyeSAxNy4wMDwvcGRmOlByb2R1Y2VyPgogICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL2pwZWc8L2RjOmZvcm1hdD4KICAgICAgICAgPGRjOmNyZWF0b3I+CiAgICAgICAgICAgIDxyZGY6U2VxPgogICAgICAgICAgICAgICA8cmRmOmxpPnlha3VwLmhhc2xhazwvcmRmOmxpPgogICAgICAgICAgICA8L3JkZjpTZXE+CiAgICAgICAgIDwvZGM6Y3JlYXRvcj4KICAgICAgICAgPGRjOnRpdGxlPgogICAgICAgICAgICA8cmRmOkFsdD4KICAgICAgICAgICAgICAgPHJkZjpsaSB4bWw6bGFuZz0ieC1kZWZhdWx0Ij5FRE0tMjNfMDQyX1FSX0ZBVFVSQV9UQVNBUklNSV9URU1BXzYwMHgxNTA8L3JkZjpsaT4KICAgICAgICAgICAgPC9yZGY6QWx0PgogICAgICAgICA8L2RjOnRpdGxlPgogICAgICAgICA8aWxsdXN0cmF0b3I6Q3JlYXRvclN1YlRvb2w+QWRvYmUgSWxsdXN0cmF0b3I8L2lsbHVzdHJhdG9yOkNyZWF0b3JTdWJUb29sPgogICAgICAgICA8eG1wTU06RG9jdW1lbnRJRD54bXAuZGlkOjk0YWI5NTAwLTBkZGItNGY1Ny1hMDM1LTBkOWFhNzVmMjA0NzwveG1wTU06RG9jdW1lbnRJRD4KICAgICAgICAgPHhtcE1NOkluc3RhbmNlSUQ+eG1wLmlpZDpiZGMwY2JjZS1lOGJiLTRlOGEtYTg0NS1mN2MwMzY1ZTAxMmU8L3htcE1NOkluc3RhbmNlSUQ+CiAgICAgICAgIDx4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ+eG1wLmRpZDpjOTU4ZjE1MC04ODMzLTQ2N2EtODcxMC1jOWYwYmFjMGRjMWU8L3htcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD4KICAgICAgICAgPHhtcE1NOlJlbmRpdGlvbkNsYXNzPnByb29mOnBkZjwveG1wTU06UmVuZGl0aW9uQ2xhc3M+CiAgICAgICAgIDx4bXBNTTpEZXJpdmVkRnJvbSByZGY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAgICAgIDxzdFJlZjppbnN0YW5jZUlEPnV1aWQ6MzY4OGMzZTYtM2YzNS00NjQ5LTk1ZmUtY2IyOTFlOWJiZTBiPC9zdFJlZjppbnN0YW5jZUlEPgogICAgICAgICAgICA8c3RSZWY6ZG9jdW1lbnRJRD54bXAuZGlkOmVkNzdlMzNhLWJiMTktNGRjNC1iMmMyLWViYTAwNzYyOWY0OTwvc3RSZWY6ZG9jdW1lbnRJRD4KICAgICAgICAgICAgPHN0UmVmOm9yaWdpbmFsRG9jdW1lbnRJRD54bXAuZGlkOmM5NThmMTUwLTg4MzMtNDY3YS04NzEwLWM5ZjBiYWMwZGMxZTwvc3RSZWY6b3JpZ2luYWxEb2N1bWVudElEPgogICAgICAgICAgICA8c3RSZWY6cmVuZGl0aW9uQ2xhc3M+cHJvb2Y6cGRmPC9zdFJlZjpyZW5kaXRpb25DbGFzcz4KICAgICAgICAgPC94bXBNTTpEZXJpdmVkRnJvbT4KICAgICAgICAgPHhtcE1NOkhpc3Rvcnk+CiAgICAgICAgICAgIDxyZGY6U2VxPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOmM5NThmMTUwLTg4MzMtNDY3YS04NzEwLWM5ZjBiYWMwZGMxZTwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAyMy0wOC0xN1QxMToyOTo1MSswMzowMDwvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgSWxsdXN0cmF0b3IgMjcuNyAoTWFjaW50b3NoKTwvc3RFdnQ6c29mdHdhcmVBZ2VudD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmNoYW5nZWQ+Lzwvc3RFdnQ6Y2hhbmdlZD4KICAgICAgICAgICAgICAgPC9yZGY6bGk+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPnNhdmVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5paWQ6YmRjMGNiY2UtZThiYi00ZThhLWE4NDUtZjdjMDM2NWUwMTJlPC9zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDIzLTA4LTIxVDIxOjU4OjM5KzAzOjAwPC9zdEV2dDp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBJbGx1c3RyYXRvciAyNy43IChNYWNpbnRvc2gpPC9zdEV2dDpzb2Z0d2FyZUFnZW50PgogICAgICAgICAgICAgICAgICA8c3RFdnQ6Y2hhbmdlZD4vPC9zdEV2dDpjaGFuZ2VkPgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgPC9yZGY6U2VxPgogICAgICAgICA8L3htcE1NOkhpc3Rvcnk+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgCjw/eHBhY2tldCBlbmQ9InciPz7/4gxYSUNDX1BST0ZJTEUAAQEAAAxITGlubwIQAABtbnRyUkdCIFhZWiAHzgACAAkABgAxAABhY3NwTVNGVAAAAABJRUMgc1JHQgAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLUhQICAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABFjcHJ0AAABUAAAADNkZXNjAAABhAAAAGx3dHB0AAAB8AAAABRia3B0AAACBAAAABRyWFlaAAACGAAAABRnWFlaAAACLAAAABRiWFlaAAACQAAAABRkbW5kAAACVAAAAHBkbWRkAAACxAAAAIh2dWVkAAADTAAAAIZ2aWV3AAAD1AAAACRsdW1pAAAD+AAAABRtZWFzAAAEDAAAACR0ZWNoAAAEMAAAAAxyVFJDAAAEPAAACAxnVFJDAAAEPAAACAxiVFJDAAAEPAAACAx0ZXh0AAAAAENvcHlyaWdodCAoYykgMTk5OCBIZXdsZXR0LVBhY2thcmQgQ29tcGFueQAAZGVzYwAAAAAAAAASc1JHQiBJRUM2MTk2Ni0yLjEAAAAAAAAAAAAAABJzUkdCIElFQzYxOTY2LTIuMQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWFlaIAAAAAAAAPNRAAEAAAABFsxYWVogAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z2Rlc2MAAAAAAAAAFklFQyBodHRwOi8vd3d3LmllYy5jaAAAAAAAAAAAAAAAFklFQyBodHRwOi8v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"/>
						</td>		
					
						<td align="right">
									<div id="qrcode"/>
									<div id="qrvalue" style="visibility: hidden; height: 30px;width: 30px; ; display:none"> 
{"vkntckn":"<xsl:value-of  select="n1:Invoice/cac:AccountingSupplierParty/cac:Party/cac:PartyIdentification/cbc:ID[@schemeID='TCKN' or @schemeID='VKN']"></xsl:value-of>",
"avkntckn":"<xsl:value-of  select="n1:Invoice/cac:AccountingCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID[@schemeID='TCKN' or @schemeID='VKN']"></xsl:value-of>",
"senaryo":"<xsl:value-of select="n1:Invoice/cbc:ProfileID"/>",
"tip":"<xsl:value-of select="n1:Invoice/cbc:InvoiceTypeCode"/>",
"tarih":"<xsl:value-of select="n1:Invoice/cbc:IssueDate"/>",
"no":"<xsl:value-of select="n1:Invoice/cbc:ID"/>",
"ETTN":"<xsl:value-of select="n1:Invoice/cbc:UUID"/>",
"parabirimi":"<xsl:value-of select="n1:Invoice/cbc:DocumentCurrencyCode"/>",
"malhizmettoplam":"<xsl:value-of select="n1:Invoice/cac:LegalMonetaryTotal/cbc:LineExtensionAmount"></xsl:value-of>",
<xsl:for-each select="n1:Invoice/cac:TaxTotal/cac:TaxSubtotal[cac:TaxCategory/cac:TaxScheme/cbc:TaxTypeCode='0015']"><xsl:text>  "hesaplanankdv</xsl:text>(<xsl:value-of select="cbc:Percent"/>)":"<xsl:value-of select="cbc:TaxAmount"/>"</xsl:for-each> 
<xsl:for-each select="n1:Invoice/cac:TaxTotal/cac:TaxSubtotal[cac:TaxCategory/cac:TaxScheme/cbc:TaxTypeCode='0015']"><xsl:text> , "kdvmatrah</xsl:text>(<xsl:value-of select="cbc:Percent"/>)":"<xsl:value-of select="cbc:TaxableAmount"/>",</xsl:for-each> 
"vergidahil":"<xsl:value-of select="n1:Invoice/cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount"/>",
"odenecek":"<xsl:value-of select="n1:Invoice/cac:LegalMonetaryTotal/cbc:PayableAmount"/>",}	

									</div>
									<script type="text/javascript">

										var qrcode = new QRCode(document.getElementById("qrcode"), {
											width : 140,
											height : 140,
											
											correctLevel : QRCode.CorrectLevel.L
										});

										function makeCode (msg) {		
											var elText = document.getElementById("text");
	
											qrcode.makeCode(msg);
										}

										makeCode(document.getElementById("qrvalue").innerHTML);
									</script>
								</td>					
					</tr>
						
						
							<tr valign="top">
								<td width="40%">
									<br/>
										<br/>
										
									<hr/>
									<table align="center" border="0" width="100%">
										<tbody>
											
											<tr align="left">
												<xsl:for-each select="n1:Invoice/cac:AccountingSupplierParty/cac:Party">


													<td align="left">
													<xsl:if test="cac:PartyName">
													<xsl:value-of select="cac:PartyName/cbc:Name"/>
													<br/>

													</xsl:if>
													<xsl:for-each select="cac:Person">
														<xsl:for-each select="cbc:Title">
														<xsl:apply-templates/>

														<xsl:text>&#160;</xsl:text>

														</xsl:for-each>
														<xsl:for-each select="cbc:FirstName">
														<xsl:apply-templates/>

														<xsl:text>&#160;</xsl:text>

														</xsl:for-each>
														<xsl:for-each select="cbc:MiddleName">
														<xsl:apply-templates/>
														<xsl:text>&#160;</xsl:text>
														</xsl:for-each>
														<xsl:for-each select="cbc:FamilyName">
														<xsl:apply-templates/>

														<xsl:text>&#160;</xsl:text>
														</xsl:for-each>
														<xsl:for-each select="cbc:NameSuffix">
														<xsl:apply-templates/>
														</xsl:for-each>
													</xsl:for-each>
													</td>

												</xsl:for-each>

											</tr>
											<tr align="left">
												<xsl:for-each select="n1:Invoice/cac:AccountingSupplierParty/cac:Party">


												<td align="left">
												<xsl:for-each select="cac:PostalAddress">
													<xsl:for-each select="cbc:StreetName">
													<xsl:apply-templates/>
													<xsl:text>&#160;</xsl:text>
													</xsl:for-each>
													<xsl:for-each select="cbc:District">
												<xsl:apply-templates/>
												<span>
												<xsl:text>&#160;</xsl:text>
												</span>
												</xsl:for-each>
													<xsl:for-each select="cbc:BuildingName">
													<xsl:apply-templates/>
													</xsl:for-each>
													<xsl:if test="cbc:BuildingNumber">
													<xsl:text> No:</xsl:text>
													<xsl:for-each select="cbc:BuildingNumber">
													<xsl:apply-templates/>
													</xsl:for-each>
													<xsl:text>&#160;</xsl:text>
													</xsl:if>
													<br/>
													<xsl:for-each select="cbc:PostalZone">
													<xsl:apply-templates/>

													<xsl:text>&#160;</xsl:text>
													</xsl:for-each>
													<xsl:for-each select="cbc:CitySubdivisionName">
													<xsl:apply-templates/>

													</xsl:for-each>
													<xsl:text>/ </xsl:text>
													<xsl:for-each select="cbc:CityName">
													<xsl:apply-templates/>
													<xsl:text>&#160;</xsl:text>
													</xsl:for-each>
												</xsl:for-each>

												</td>
												</xsl:for-each>


											</tr>
											<xsl:if
												test="//n1:Invoice/cac:AccountingSupplierParty/cac:Party/cac:Contact/cbc:Telephone or //n1:Invoice/cac:AccountingSupplierParty/cac:Party/cac:Contact/cbc:Telefax">
												<tr align="left">
												<xsl:for-each select="n1:Invoice">
												<xsl:for-each select="cac:AccountingSupplierParty">
												<xsl:for-each select="cac:Party">
												<td align="left">
												<xsl:for-each select="cac:Contact">
												<xsl:if test="cbc:Telephone">
												<span>
												<xsl:text>Tel: </xsl:text>
												</span>
												<xsl:for-each select="cbc:Telephone">
												<xsl:apply-templates/>
												</xsl:for-each>
												</xsl:if>
												<xsl:if test="cbc:Telefax">
												<span>
												<xsl:text> Fax: </xsl:text>
												</span>
												<xsl:for-each select="cbc:Telefax">
												<xsl:apply-templates/>
												</xsl:for-each>
												</xsl:if>
												<span>
												<xsl:text>&#160;</xsl:text>
												</span>
												</xsl:for-each>
												</td>
												</xsl:for-each>
												</xsl:for-each>
												</xsl:for-each>
												</tr>
											</xsl:if>
											<xsl:for-each
												select="//n1:Invoice/cac:AccountingSupplierParty/cac:Party/cbc:WebsiteURI">
												<tr align="left">
												<td>
												<xsl:text>Web Sitesi: </xsl:text>
												<xsl:value-of select="."/>
												</td>
												</tr>
											</xsl:for-each>
											<xsl:for-each
												select="//n1:Invoice/cac:AccountingSupplierParty/cac:Party/cac:Contact/cbc:ElectronicMail">
												<tr align="left">
												<td>
												<xsl:text>E-Posta: </xsl:text>
												<xsl:value-of select="."/>
												</td>
												</tr>
											</xsl:for-each>
											<tr align="left">
												<xsl:for-each select="n1:Invoice">
												<xsl:for-each select="cac:AccountingSupplierParty">
												<xsl:for-each select="cac:Party">
												<td align="left">
												<span>
												<xsl:text>Vergi Dairesi: </xsl:text>
												</span>
												<xsl:for-each select="cac:PartyTaxScheme">
												<xsl:for-each select="cac:TaxScheme">
												<xsl:for-each select="cbc:Name">
												<xsl:apply-templates/>
												</xsl:for-each>
												</xsl:for-each>
												<span>
												<xsl:text>&#160; </xsl:text>
												</span>
												</xsl:for-each>
												</td>
												</xsl:for-each>
												</xsl:for-each>
												</xsl:for-each>
											</tr>
											<xsl:for-each
												select="//n1:Invoice/cac:AccountingSupplierParty/cac:Party/cac:PartyIdentification">
												<tr align="left">
												<td>
												<xsl:value-of select="cbc:ID/@schemeID"/>
												<xsl:text>: </xsl:text>
												<xsl:value-of select="cbc:ID"/>
												</td>
												</tr>
											</xsl:for-each>
										</tbody>
									</table>
									<hr/>
								</td>
								<td width="40%" align="center" valign="middle" colspan="2">
									<br/>
									<br/>
									<img style="width:91px;" align="middle" alt="E-Fatura Logo"
										src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4QBoRXhpZgAASUkqAAgAAAADABIBAwABAAAAAQAAADEBAgAQAAAAMgAAAGmHBAABAAAAQgAAAAAAAABTaG90d2VsbCAwLjIyLjAAAgACoAkAAQAAAKYBAAADoAkAAQAAAKYBAAAAAAAA/+EJ9Gh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8APD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNC40LjAtRXhpdjIiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyIgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iIGV4aWY6UGl4ZWxYRGltZW5zaW9uPSI0MjIiIGV4aWY6UGl4ZWxZRGltZW5zaW9uPSI0MjIiIHRpZmY6SW1hZ2VXaWR0aD0iNDIyIiB0aWZmOkltYWdlSGVpZ2h0PSI0MjIiIHRpZmY6T3JpZW50YXRpb249IjEiLz4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8P3hwYWNrZXQgZW5kPSJ3Ij8+/9sAQwADAgIDAgIDAwMDBAMDBAUIBQUE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"/>

									<h1 align="center">
										<span style="font-weight:bold;">
											<xsl:text>e-FATURA</xsl:text>
										</span>
									</h1>
								</td>
								
								
								
						<!-- <td align="right" valign="middle"> -->
									<!-- <img style="width:230px; height:150;" align="middle" src=""/> -->
								<!-- </td>                                               -->

								
							</tr>
							<tr style="height:118px; " valign="top">
								<td width="40%" align="right" valign="bottom">
									<table id="customerPartyTable" align="left" border="0">
										<tbody>
											<tr style="height:71px; ">
												<td>
												<hr/>
												<table align="center" border="0">
												<tbody>
												<tr>
												<xsl:for-each select="n1:Invoice/cac:AccountingCustomerParty/cac:Party">
													<td style="width:469px; " align="left">
														<span style="font-weight:bold; ">
															<xsl:text>SAYIN</xsl:text>
														</span>
													</td>
												</xsl:for-each>													
												</tr>
												<tr>
													<xsl:choose>
														<xsl:when test="n1:Invoice/cac:BuyerCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID[@schemeID='PARTYTYPE' and text()='TAXFREE']">
															<xsl:for-each select="n1:Invoice/cac:BuyerCustomerParty/cac:Party">
																<xsl:call-template name="Party_Title">
																	<xsl:with-param name="PartyType">TAXFREE</xsl:with-param>
																</xsl:call-template>
															</xsl:for-each>															
														</xsl:when>
														<xsl:when test="n1:Invoice/cac:BuyerCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID[@schemeID='PARTYTYPE' and text()='EXPORT']">
															<xsl:for-each select="n1:Invoice/cac:BuyerCustomerParty/cac:Party">
																<xsl:call-template name="Party_Title">
																	<xsl:with-param name="PartyType">EXPORT</xsl:with-param>
																</xsl:call-template>
															</xsl:for-each>															
														</xsl:when>
														<xsl:otherwise>
															<xsl:for-each select="n1:Invoice/cac:AccountingCustomerParty/cac:Party">
																<xsl:call-template name="Party_Title">
																	<xsl:with-param name="PartyType">OTHER</xsl:with-param>
																</xsl:call-template>
															</xsl:for-each>															
														</xsl:otherwise>
													</xsl:choose>													
												</tr>
													<xsl:choose>
														<xsl:when test="n1:Invoice/cac:BuyerCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID[@schemeID='PARTYTYPE' and text()='TAXFREE']">
																<xsl:for-each select="n1:Invoice/cac:BuyerCustomerParty/cac:Party">
																	<tr>
																		<xsl:call-template name="Party_Adress">
																			<xsl:with-param name="PartyType">TAXFREE</xsl:with-param>
																		</xsl:call-template>
																	</tr>
																	<xsl:call-template name="Party_Other">
																		<xsl:with-param name="PartyType">TAXFREE</xsl:with-param>
																	</xsl:call-template>
																</xsl:for-each>															
														</xsl:when>
														<xsl:when test="n1:Invoice/cac:BuyerCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID[@schemeID='PARTYTYPE' and text()='EXPORT']">
															<xsl:for-each select="n1:Invoice/cac:BuyerCustomerParty/cac:Party">
																<tr>
																	<xsl:call-template name="Party_Adress">
																		<xsl:with-param name="PartyType">EXPORT</xsl:with-param>
																	</xsl:call-template>
																</tr>
																<xsl:call-template name="Party_Other">
																	<xsl:with-param name="PartyType">EXPORT</xsl:with-param>
																</xsl:call-template>
															</xsl:for-each>															
														</xsl:when>
														<xsl:otherwise>
															<xsl:for-each select="n1:Invoice/cac:AccountingCustomerParty/cac:Party">
																<tr>
																	<xsl:call-template name="Party_Adress">
																		<xsl:with-param name="PartyType">OTHER</xsl:with-param>																	
																	</xsl:call-template>
																</tr>
																<xsl:call-template name="Party_Other">
																	<xsl:with-param name="PartyType">OTHER</xsl:with-param>
																</xsl:call-template>
															</xsl:for-each>
														</xsl:otherwise>
													</xsl:choose>																										
												</tbody>
												</table>
												<hr/>
												</td>
											</tr>
										</tbody>
									</table>
									<br/>
								</td>
									<td align="right" valign="middle" colspan="2">
									<img style="width:230px; height:150;" align="middle" src=""/>
								</td>  
  
								<td width="50%" valign="bottom" >
									<table border="1" id="despatchTable">
										<tbody>
											<tr>
												<td style="width:105px;" align="left">
												<span style="font-weight:bold; ">
												<xsl:text>Özelleştirme No:</xsl:text>
												</span>
												</td>
												<td style="width:110px;" align="left">
													<xsl:for-each select="n1:Invoice/cbc:CustomizationID">
														<xsl:apply-templates/>
													</xsl:for-each>
												</td>
											</tr>
											<tr style="height:13px; ">
												<td align="left">
												<span style="font-weight:bold; ">
												<xsl:text>Senaryo:</xsl:text>
												</span>
												</td>
												<td align="left">
													<xsl:for-each select="n1:Invoice/cbc:ProfileID">
														<xsl:apply-templates/>
													</xsl:for-each>
												</td>
											</tr>
											<tr style="height:13px; ">
												<td align="left">
												<span style="font-weight:bold; ">
												<xsl:text>Fatura Tipi:</xsl:text>
												</span>
												</td>
												<td align="left">
													<xsl:for-each select="n1:Invoice/cbc:InvoiceTypeCode">
														<xsl:apply-templates/>
													</xsl:for-each>
												</td>
											</tr>
											<tr style="height:13px; ">
												<td align="left">
												<span style="font-weight:bold; ">
												<xsl:text>Fatura No:</xsl:text>
												</span>
												</td>
												<td align="left">
													<xsl:for-each select="n1:Invoice/cbc:ID">
														<xsl:apply-templates/>
													</xsl:for-each>
												</td>
											</tr>
											<tr style="height:13px; ">
												<td align="left">
												<span style="font-weight:bold; ">
												<xsl:text>Fatura Tarihi:</xsl:text>
												</span>
												</td>
												<td align="left">
													<xsl:for-each select="n1:Invoice/cbc:IssueDate">
														<xsl:apply-templates select="."/>
													</xsl:for-each>
												</td>
											</tr>
											<xsl:for-each select="n1:Invoice/cac:DespatchDocumentReference">
												<tr style="height:13px; ">
													<td align="left">
														<span style="font-weight:bold; ">
															<xsl:text>İrsaliye No:</xsl:text>
														</span>
														<xsl:text>&#160;</xsl:text>
													</td>
													<td align="left">
														<xsl:value-of select="cbc:ID"/>
													</td>
												</tr>
												<tr style="height:13px; ">
													<td align="left">
														<span style="font-weight:bold; ">
															<xsl:text>İrsaliye Tarihi:</xsl:text>
														</span>
													</td>
													<td align="left">
														<xsl:for-each select="cbc:IssueDate">
															<xsl:apply-templates select="."/>
														</xsl:for-each>
													</td>
												</tr>
											</xsl:for-each>
											<xsl:if test="//n1:Invoice/cac:OrderReference">
												<tr style="height:13px">
													<td align="left">
														<span style="font-weight:bold; ">
															<xsl:text>Sipariş No:</xsl:text>
														</span>
													</td>
													<td align="left">
														<xsl:for-each select="n1:Invoice/cac:OrderReference/cbc:ID">
															<xsl:apply-templates/>
														</xsl:for-each>
													</td>
												</tr>
											</xsl:if>
											<xsl:if	test="//n1:Invoice/cac:OrderReference/cbc:IssueDate">
												<tr style="height:13px">
													<td align="left">
														<span style="font-weight:bold; ">
														<xsl:text>Sipariş Tarihi:</xsl:text>
														</span>
													</td>
													<td align="left">
														<xsl:for-each select="n1:Invoice/cac:OrderReference/cbc:IssueDate">
															<xsl:apply-templates select="."/>
														</xsl:for-each>
													</td>
												</tr>
											</xsl:if>
											<xsl:for-each select="n1:Invoice/cac:TaxRepresentativeParty/cac:PartyIdentification/cbc:ID[@schemeID='ARACIKURUMVKN']"> 
												<tr>
													<td style="width:105px;" align="left">
														<span style="font-weight:bold; ">
															<xsl:text>Aracı Kurum VKN:</xsl:text>
														</span>
													</td>
													<td style="width:110px;" align="left">
														<xsl:value-of select="."/>
													</td>
												</tr>
												<tr>
													<td style="width:105px;" align="left">
														<span style="font-weight:bold; ">
															<xsl:text>Aracı Kurum Unvan:</xsl:text>
														</span>
													</td>
													<td style="width:110px;" align="left">
														<xsl:value-of select="../../cac:PartyName/cbc:Name"/>
													</td>
												</tr>
											</xsl:for-each>											
										</tbody>
									</table>
								</td>
							</tr>
							<tr align="left">
								<td align="left" valign="top" id="ettnTable">
									<span style="font-weight:bold; ">
										<xsl:text>ETTN:&#160;</xsl:text>
									</span>
									<xsl:for-each select="n1:Invoice/cbc:UUID">
										<xsl:apply-templates/>
									</xsl:for-each>
								</td>
							</tr>
							
							<tr><td><br/></td></tr>
							<!-- <xsl:if test="//n1:Invoice/cac:AccountingCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID = 7750409379"> -->
											
							<!-- <tr> -->
							<!-- <td> -->
								<!-- <table border="1"> -->
										<!-- <tbody> -->
											<!-- <tr> -->
												<!-- <td style="width:105px; " align="left"> -->
													<!-- <span style="font-weight:bold; "> -->
														<!-- <xsl:text>Sağlık Fatura Tipi:</xsl:text> -->
													<!-- </span> -->
												<!-- </td> -->
												<!-- <td align="left"> -->
													<!-- <xsl:for-each select="n1:Invoice"> -->
														<!-- <xsl:for-each select="cbc:AccountingCost"> -->
															<!-- <xsl:apply-templates/> -->
														<!-- </xsl:for-each> -->
													<!-- </xsl:for-each> -->
												<!-- </td> -->
											<!-- </tr> -->
											<!-- <xsl:if test="//n1:Invoice/cac:AdditionalDocumentReference/cbc:DocumentTypeCode='MUKELLEF_KODU'"> -->
											<!-- <tr style="height:13px; "> -->
												<!-- <td align="left"> -->
													<!-- <span style="font-weight:bold; "> -->
														<!-- <xsl:text>Mükellef Kodu:</xsl:text> -->
													<!-- </span> -->
												<!-- </td> -->
												<!-- <td align="left"> -->
													<!-- <xsl:for-each select="n1:Invoice"> -->
														<!-- <xsl:for-each select="cac:AdditionalDocumentReference[cbc:DocumentTypeCode='MUKELLEF_KODU']/cbc:DocumentType"> -->
															<!-- <xsl:apply-templates/> -->
														<!-- </xsl:for-each> -->
													<!-- </xsl:for-each> -->
												<!-- </td> -->
											<!-- </tr> -->
											<!-- </xsl:if> -->
											<!-- <xsl:if test="//n1:Invoice/cac:AdditionalDocumentReference/cbc:DocumentTypeCode='MUKELLEF_ADI'"> -->
											<!-- <tr style="height:13px; "> -->
												<!-- <td align="left"> -->
													<!-- <span style="font-weight:bold; "> -->
														<!-- <xsl:text>Mükellef Adı:</xsl:text> -->
													<!-- </span> -->
												<!-- </td> -->
												<!-- <td align="left"> -->
													<!-- <xsl:for-each select="n1:Invoice"> -->
															<!-- <xsl:for-each select="cac:AdditionalDocumentReference[cbc:DocumentTypeCode='MUKELLEF_ADI']/cbc:DocumentType"> -->
														<!-- <xsl:apply-templates/> -->
														<!-- </xsl:for-each> -->
													<!-- </xsl:for-each> -->
												<!-- </td> -->
											<!-- </tr> -->
											<!-- </xsl:if> -->
											<!-- <xsl:if test="//n1:Invoice/cac:AdditionalDocumentReference/cbc:DocumentTypeCode='DOSYA_NO'"> -->
											<!-- <tr style="height:13px; "> -->
												<!-- <td align="left"> -->
													<!-- <span style="font-weight:bold; "> -->
														<!-- <xsl:text>Dosya No:</xsl:text> -->
													<!-- </span> -->
												<!-- </td> -->
												<!-- <td align="left"> -->
													<!-- <xsl:for-each select="n1:Invoice"> -->
															<!-- <xsl:for-each select="cac:AdditionalDocumentReference[cbc:DocumentTypeCode='DOSYA_NO']/cbc:DocumentType"> -->
															<!-- <xsl:apply-templates/> -->
														<!-- </xsl:for-each> -->
													<!-- </xsl:for-each> -->
												<!-- </td> -->
											<!-- </tr> -->
											<!-- </xsl:if> -->
											 <!-- <xsl:if test="//n1:Invoice/cac:AdditionalDocumentReference/cbc:DocumentTypeCode='HARCAMA_REFERANS_NO'"> -->
                      <!-- <tr style="height:13px; "> -->
                        <!-- <td align="left"> -->
                          <!-- <span style="font-weight:bold; "> -->
                            <!-- <xsl:text>Harcama Ref.No:</xsl:text> -->
                          <!-- </span> -->
                        <!-- </td> -->
                        <!-- <td align="left"> -->
                          <!-- <xsl:for-each select="n1:Invoice"> -->
                              <!-- <xsl:for-each select="cac:AdditionalDocumentReference[cbc:DocumentTypeCode='HARCAMA_REFERANS_NO']/cbc:DocumentType"> -->
                              <!-- <xsl:apply-templates/> -->
                            <!-- </xsl:for-each> -->
                          <!-- </xsl:for-each> -->
                        <!-- </td> -->
                      <!-- </tr> -->
                      <!-- </xsl:if> -->
                      <!-- <xsl:if test="//n1:Invoice/cac:AdditionalDocumentReference/cbc:DocumentTypeCode='ABONE_NO'"> -->
                      <!-- <tr style="height:13px; "> -->
                        <!-- <td align="left"> -->
                          <!-- <span style="font-weight:bold; "> -->
                            <!-- <xsl:text>Abone No:</xsl:text> -->
                          <!-- </span> -->
                        <!-- </td> -->
                        <!-- <td align="left"> -->
                          <!-- <xsl:for-each select="n1:Invoice"> -->
                              <!-- <xsl:for-each select="cac:AdditionalDocumentReference[cbc:DocumentTypeCode='ABONE_NO']/cbc:DocumentType"> -->
                              <!-- <xsl:apply-templates/> -->
                            <!-- </xsl:for-each> -->
                          <!-- </xsl:for-each> -->
                        <!-- </td> -->
                      <!-- </tr> -->
                      <!-- </xsl:if> -->
											<!-- <xsl:if test="//n1:Invoice/cac:InvoicePeriod/cbc:StartDate or //n1:Invoice/cac:InvoicePeriod/cbc:EndDate"> -->
											<!-- <tr style="height:13px; "> -->
												<!-- <td align="left"> -->
													<!-- <span style="font-weight:bold; "> -->
														<!-- <xsl:text>Dönem:</xsl:text> -->
													<!-- </span> -->
												<!-- </td> -->
												<!-- <td align="left"> -->
													<!-- <xsl:for-each select="n1:Invoice"> -->
															<!-- <xsl:for-each select="cac:InvoicePeriod/cbc:StartDate"> -->

															<!-- <xsl:apply-templates/> -->
														<!-- </xsl:for-each> -->
														<!-- <span> -->
															<!-- <xsl:text> / </xsl:text> -->
														<!-- </span> -->
															<!-- <xsl:for-each select="cac:InvoicePeriod/cbc:EndDate"> -->

															<!-- <xsl:apply-templates/> -->
														<!-- </xsl:for-each> -->
													<!-- </xsl:for-each> -->
													
												<!-- </td> -->
												<!-- </tr> -->
												<!-- </xsl:if> -->
											
											<!-- </tbody> -->
											<!-- </table> -->
							<!-- </td> -->
							<!-- </tr> -->
							<!-- </xsl:if> -->
							<tr><td><br/></td></tr>
						</tbody>
					</table>
					<div id="lineTableAligner">
						<span>
							<xsl:text>&#160;</xsl:text>
						</span>
					</div>
					<table border="1" id="lineTable" width="800">
						<tbody>
							<tr class="lineTableTr">
								<td class="lineTableTd" style="width:3%" align="center">
									<span style="font-weight:bold;">
										<xsl:text>Sıra No</xsl:text>
									</span>
								</td>
								<td class="lineTableTd" style="width:20%" align="center">
									<span style="font-weight:bold;">
										<xsl:text>Mal Hizmet</xsl:text>
									</span>
								</td>
								<td class="lineTableTd" style="width:7.4%" align="center">
									<span style="font-weight:bold;">
										<xsl:text>Miktar</xsl:text>
									</span>
								</td>
								<td class="lineTableTd" style="width:9%" align="center">
									<span style="font-weight:bold;">
										<xsl:text>Birim Fiyat</xsl:text>
									</span>
								</td>
								<td class="lineTableTd" style="width:7%" align="center">
									<span style="font-weight:bold;">
										<xsl:text>İskonto Oranı</xsl:text>
									</span>
								</td>
								<td class="lineTableTd" style="width:9%" align="center">
									<span style="font-weight:bold;">
										<xsl:text>İskonto Tutarı</xsl:text>
									</span>
								</td>
								<td class="lineTableTd" style="width:7%" align="center">
									<span style="font-weight:bold;">
										<xsl:text>KDV Oranı</xsl:text>
									</span>
								</td>
								<td class="lineTableTd" style="width:10%" align="center">
									<span style="font-weight:bold;">
										<xsl:text>KDV Tutarı</xsl:text>
									</span>
								</td>
								<td class="lineTableTd" style="width:17%; " align="center">
									<span style="font-weight:bold;">
										<xsl:text>Diğer Vergiler</xsl:text>
									</span>
								</td>
								<td class="lineTableTd" style="width:10.6%" align="center">
									<span style="font-weight:bold;">
										<xsl:text>Mal Hizmet Tutarı</xsl:text>
									</span>
								</td>
								<xsl:if test="//n1:Invoice/cbc:ProfileID='IHRACAT'">
									<td class="lineTableTd" style="width:10.6%" align="center">
										<span style="font-weight:bold;">
											<xsl:text>Teslim Şartı</xsl:text>
										</span>
									</td>									
									<td class="lineTableTd" style="width:10.6%" align="center">
										<span style="font-weight:bold;">
											<xsl:text>Eşya Kap Cinsi</xsl:text>
										</span>
									</td>									
									<td class="lineTableTd" style="width:10.6%" align="center">
										<span style="font-weight:bold;">
											<xsl:text>Kap No</xsl:text>
										</span>
									</td>									
									<td class="lineTableTd" style="width:10.6%" align="center">
										<span style="font-weight:bold;">
											<xsl:text>Kap Adet</xsl:text>
										</span>
									</td>									
									<td class="lineTableTd" style="width:10.6%" align="center">
										<span style="font-weight:bold;">
											<xsl:text>Teslim/Bedel Ödeme Yeri</xsl:text>
										</span>
									</td>									
									<td class="lineTableTd" style="width:10.6%" align="center">
										<span style="font-weight:bold;">
											<xsl:text>Gönderilme Şekli</xsl:text>
										</span>
									</td>									
									<td class="lineTableTd" style="width:10.6%" align="center">
										<span style="font-weight:bold;">
											<xsl:text>GTİP</xsl:text>
										</span>
									</td>									
								</xsl:if>
							</tr>
							<xsl:if test="count(//n1:Invoice/cac:InvoiceLine) &gt;= 0">
								<xsl:for-each select="//n1:Invoice/cac:InvoiceLine">
									<xsl:apply-templates select="."/>
								</xsl:for-each>
							</xsl:if>
							
						</tbody>
					</table>
				</xsl:for-each>
				<table id="budgetContainerTable" width="800px">
					<tr align="right">
						<td/>
						<td class="lineTableBudgetTd" align="right" width="200px">
							<span style="font-weight:bold; ">
								<xsl:text>Mal Hizmet Toplam Tutarı</xsl:text>
							</span>
						</td>
						<td class="lineTableBudgetTd" style="width:81px; " align="right">
							<xsl:for-each select="n1:Invoice/cac:LegalMonetaryTotal/cbc:LineExtensionAmount">
								<xsl:call-template name="Curr_Type"/>
							</xsl:for-each>
						</td>
					</tr>
					<xsl:for-each select="n1:Invoice/cac:TaxTotal/cac:TaxSubtotal">
						<xsl:if test="cac:TaxCategory/cac:TaxScheme/cbc:TaxTypeCode = '4171'">
							<tr align="right">
								<td/>
								<td class="lineTableBudgetTd" align="right" width="200px">
									<span style="font-weight:bold; ">
										<xsl:text>Teslim Bedeli</xsl:text>
									</span>
								</td>
								<td class="lineTableBudgetTd" style="width:81px; " align="right">
									<xsl:for-each select="//n1:Invoice/cac:LegalMonetaryTotal/cbc:LineExtensionAmount">
										<xsl:call-template name="Curr_Type"/>
									</xsl:for-each>
								</td>
							</tr>
						</xsl:if>
					</xsl:for-each>
					<tr align="right">
						<td/>
						<td class="lineTableBudgetTd" align="right" width="200px">
							<span style="font-weight:bold; ">
								<xsl:text>Toplam İskonto</xsl:text>
							</span>
						</td>
						<td class="lineTableBudgetTd" style="width:81px; " align="right">
							<xsl:for-each select="n1:Invoice/cac:LegalMonetaryTotal/cbc:AllowanceTotalAmount">
								<xsl:call-template name="Curr_Type"/>
							</xsl:for-each>
						</td>
					</tr>
					<xsl:for-each select="n1:Invoice/cac:TaxTotal/cac:TaxSubtotal">
						<tr align="right">
							<td/>
							<td class="lineTableBudgetTd" width="211px" align="right">
								<span style="font-weight:bold; ">
									<xsl:text>Hesaplanan </xsl:text>
									<xsl:value-of select="cac:TaxCategory/cac:TaxScheme/cbc:Name"/>
									<xsl:if test="../../cbc:InvoiceTypeCode!='OZELMATRAH'">
										<xsl:text>(%</xsl:text>
										<xsl:value-of select="cbc:Percent"/>
										<xsl:text>)</xsl:text>
									</xsl:if>
								</span>
							</td>
							<td class="lineTableBudgetTd" style="width:82px; " align="right">
								<xsl:if test="../../cbc:InvoiceTypeCode='OZELMATRAH'">
									<xsl:text> </xsl:text>
									<xsl:text>DAHİLDİR</xsl:text>
								</xsl:if>
								<xsl:if test="../../cbc:InvoiceTypeCode!='OZELMATRAH'">
									<xsl:for-each select="cac:TaxCategory/cac:TaxScheme">
										<xsl:text> </xsl:text>
										<xsl:value-of
											select="format-number(../../cbc:TaxAmount, '###.##0,00', 'european')"/>
										<xsl:if test="../../cbc:TaxAmount/@currencyID">
											<xsl:text> </xsl:text>
											<xsl:if test="../../cbc:TaxAmount/@currencyID = 'TRL' or ../../cbc:TaxAmount/@currencyID = 'TRY'">
												<xsl:text>TL</xsl:text>
											</xsl:if>
											<xsl:if test="../../cbc:TaxAmount/@currencyID != 'TRL' and ../../cbc:TaxAmount/@currencyID != 'TRY'">
												<xsl:value-of select="../../cbc:TaxAmount/@currencyID"/>
											</xsl:if>
										</xsl:if>
									</xsl:for-each>
								</xsl:if>
							</td>
						</tr>
					</xsl:for-each>
					<xsl:for-each select="n1:Invoice/cac:TaxTotal/cac:TaxSubtotal">
						<xsl:if test="cac:TaxCategory/cac:TaxScheme/cbc:TaxTypeCode = '4171'">
							<tr align="right">
								<td/>
								<td class="lineTableBudgetTd" align="right" width="200px">
									<span style="font-weight:bold; ">
										<xsl:text>KDV Matrahı</xsl:text>
									</span>
								</td>
								<td class="lineTableBudgetTd" style="width:81px; " align="right">
									<xsl:value-of
											select="format-number(sum(//n1:Invoice/cac:TaxTotal/cac:TaxSubtotal[cac:TaxCategory/cac:TaxScheme/cbc:TaxTypeCode=0015]/cbc:TaxableAmount), '###.##0,00', 'european')"/>										
									<xsl:if
										test="//n1:Invoice/cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount/@currencyID">
										<xsl:text> </xsl:text>
										<xsl:if
											test="//n1:Invoice/cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount/@currencyID = 'TRL' or //n1:Invoice/cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount/@currencyID = 'TRY'">
											<xsl:text>TL</xsl:text>
										</xsl:if>
										<xsl:if
											test="//n1:Invoice/cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount/@currencyID != 'TRL' and //n1:Invoice/cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount/@currencyID != 'TRY'">
											<xsl:value-of
												select="//n1:Invoice/cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount/@currencyID"
											/>
										</xsl:if>
									</xsl:if>
								</td>
							</tr>
							<tr align="right">
								<td/>
								<td class="lineTableBudgetTd" align="right" width="200px">
									<span style="font-weight:bold; ">
										<xsl:text>Tevkifat Dahil Toplam Tutar</xsl:text>
									</span>
								</td>
								<td class="lineTableBudgetTd" style="width:81px; " align="right">
									<xsl:for-each select="//n1:Invoice/cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount">
										<xsl:call-template name="Curr_Type"/>
									</xsl:for-each>
								</td>
							</tr>
							<tr align="right">
								<td/>
								<td class="lineTableBudgetTd" align="right" width="200px">
									<span style="font-weight:bold; ">
										<xsl:text>Tevkifat Hariç Toplam Tutar</xsl:text>
									</span>
								</td>
								<td class="lineTableBudgetTd" style="width:81px; " align="right">
									<xsl:for-each select="//n1:Invoice/cac:LegalMonetaryTotal/cbc:PayableAmount">
										<xsl:call-template name="Curr_Type"/>
									</xsl:for-each>
								</td>
							</tr>
						</xsl:if>						
					</xsl:for-each>
					<xsl:for-each select="n1:Invoice/cac:WithholdingTaxTotal/cac:TaxSubtotal">
						<tr align="right">
							<td/>
							<td class="lineTableBudgetTd" width="211px" align="right">
								<span style="font-weight:bold; ">
									<xsl:text>Hesaplanan KDV Tevkifat</xsl:text>
									<xsl:text>(%</xsl:text>
									<xsl:value-of select="cbc:Percent"/>
									<xsl:text>)</xsl:text>
								</span>
							</td>
							<td class="lineTableBudgetTd" style="width:82px; " align="right">
								<xsl:for-each select="cac:TaxCategory/cac:TaxScheme">
									<xsl:text> </xsl:text>
									<xsl:value-of
										select="format-number(../../cbc:TaxAmount, '###.##0,00', 'european')"/>
									<xsl:if test="../../cbc:TaxAmount/@currencyID">
										<xsl:text> </xsl:text>
										<xsl:if test="../../cbc:TaxAmount/@currencyID = 'TRL' or ../../cbc:TaxAmount/@currencyID = 'TRY'">
											<xsl:text>TL</xsl:text>
										</xsl:if>
										<xsl:if test="../../cbc:TaxAmount/@currencyID != 'TRL' and ../../cbc:TaxAmount/@currencyID != 'TRY'">
											<xsl:value-of select="../../cbc:TaxAmount/@currencyID"/>
										</xsl:if>
									</xsl:if>
								</xsl:for-each>
							</td>
						</tr>
					</xsl:for-each>
					<xsl:if
						test="sum(n1:Invoice/cac:TaxTotal/cac:TaxSubtotal[cac:TaxCategory/cac:TaxScheme/cbc:TaxTypeCode=9015]/cbc:TaxableAmount)>0">
						<tr align="right">
							<td/>
							<td class="lineTableBudgetTd" width="211px" align="right">
								<span style="font-weight:bold; ">
									<xsl:text>Tevkifata Tabi İşlem Tutarı</xsl:text>
								</span>
							</td>
							<td class="lineTableBudgetTd" style="width:82px; " align="right">
								<xsl:value-of
									select="format-number(sum(n1:Invoice/cac:InvoiceLine[cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory/cac:TaxScheme/cbc:TaxTypeCode=9015]/cbc:LineExtensionAmount), '###.##0,00', 'european')"/>
								<xsl:if test="n1:Invoice/cbc:DocumentCurrencyCode = 'TRL'">
									<xsl:text>TL</xsl:text>
								</xsl:if>
								<xsl:if test="n1:Invoice/cbc:DocumentCurrencyCode != 'TRL'">
									<xsl:value-of select="n1:Invoice/cbc:DocumentCurrencyCode"/>
								</xsl:if>
							</td>
						</tr>
						<tr align="right">
							<td/>
							<td class="lineTableBudgetTd" width="211px" align="right">
								<span style="font-weight:bold; ">
									<xsl:text>Tevkifata Tabi İşlem Üzerinden Hes. KDV</xsl:text>
								</span>
							</td>
							<td class="lineTableBudgetTd" style="width:82px; " align="right">
								<xsl:value-of
									select="format-number(sum(n1:Invoice/cac:TaxTotal/cac:TaxSubtotal[cac:TaxCategory/cac:TaxScheme/cbc:TaxTypeCode=9015]/cbc:TaxableAmount), '###.##0,00', 'european')"/>
								<xsl:if test="n1:Invoice/cbc:DocumentCurrencyCode = 'TRL'">
									<xsl:text>TL</xsl:text>
								</xsl:if>
								<xsl:if test="n1:Invoice/cbc:DocumentCurrencyCode != 'TRL'">
									<xsl:value-of select="n1:Invoice/cbc:DocumentCurrencyCode"/>
								</xsl:if>
							</td>
						</tr>
					</xsl:if>					
					<xsl:if test = "n1:Invoice/cac:InvoiceLine[cac:WithholdingTaxTotal/cac:TaxSubtotal/cac:TaxCategory/cac:TaxScheme]">
						<tr align="right">
							<td/>
							<td class="lineTableBudgetTd" width="211px" align="right">
								<span style="font-weight:bold; ">
									<xsl:text>Tevkifata Tabi İşlem Tutarı</xsl:text>
								</span>
							</td>
							<td class="lineTableBudgetTd" style="width:82px; " align="right">
								<xsl:if test = "n1:Invoice/cac:InvoiceLine[cac:WithholdingTaxTotal/cac:TaxSubtotal/cac:TaxCategory/cac:TaxScheme]">
									<xsl:value-of
										select="format-number(sum(n1:Invoice/cac:InvoiceLine[cac:WithholdingTaxTotal/cac:TaxSubtotal/cac:TaxCategory/cac:TaxScheme]/cbc:LineExtensionAmount), '###.##0,00', 'european')"/>
								</xsl:if>
								<xsl:if test = "//n1:Invoice/cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory/cac:TaxScheme/cbc:TaxTypeCode=&apos;9015&apos;">
									<xsl:value-of
										select="format-number(sum(n1:Invoice/cac:InvoiceLine[cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory/cac:TaxScheme/cbc:TaxTypeCode=9015]/cbc:LineExtensionAmount), '###.##0,00', 'european')"/>
								</xsl:if>								
								<xsl:if test="n1:Invoice/cbc:DocumentCurrencyCode = 'TRL' or n1:Invoice/cbc:DocumentCurrencyCode = 'TRY'">
									<xsl:text>TL</xsl:text>
								</xsl:if>
								<xsl:if test="n1:Invoice/cbc:DocumentCurrencyCode != 'TRL' and n1:Invoice/cbc:DocumentCurrencyCode != 'TRY'">
									<xsl:value-of select="n1:Invoice/cbc:DocumentCurrencyCode"/>
								</xsl:if>
							</td>
						</tr>
						<tr align="right">
							<td/>
							<td class="lineTableBudgetTd" width="211px" align="right">
								<span style="font-weight:bold; ">
									<xsl:text>Tevkifata Tabi İşlem Üzerinden Hes. KDV</xsl:text>
								</span>
							</td>
							<td class="lineTableBudgetTd" style="width:82px; " align="right">
								<xsl:if test = "n1:Invoice/cac:InvoiceLine[cac:WithholdingTaxTotal/cac:TaxSubtotal/cac:TaxCategory/cac:TaxScheme]">
									<xsl:value-of
										select="format-number(sum(n1:Invoice/cac:WithholdingTaxTotal/cac:TaxSubtotal[cac:TaxCategory/cac:TaxScheme]/cbc:TaxableAmount), '###.##0,00', 'european')"/>
								</xsl:if>
								<xsl:if test = "//n1:Invoice/cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory/cac:TaxScheme/cbc:TaxTypeCode=&apos;9015&apos;">
									<xsl:value-of
										select="format-number(sum(n1:Invoice/cac:TaxTotal/cac:TaxSubtotal[cac:TaxCategory/cac:TaxScheme/cbc:TaxTypeCode=9015]/cbc:TaxableAmount), '###.##0,00', 'european')"/>
								</xsl:if>
								<xsl:if test="n1:Invoice/cbc:DocumentCurrencyCode = 'TRL' or n1:Invoice/cbc:DocumentCurrencyCode = 'TRY'">
									<xsl:text>TL</xsl:text>
								</xsl:if>
								<xsl:if test="n1:Invoice/cbc:DocumentCurrencyCode != 'TRL' and n1:Invoice/cbc:DocumentCurrencyCode != 'TRY'">
									<xsl:value-of select="n1:Invoice/cbc:DocumentCurrencyCode"/>
								</xsl:if>
							</td>
						</tr>
					</xsl:if>
					<tr align="right">
						<td/>
						<td class="lineTableBudgetTd" width="200px" align="right">
							<span style="font-weight:bold; ">
								<xsl:text>Vergiler Dahil Toplam Tutar</xsl:text>
							</span>
						</td>
						<td class="lineTableBudgetTd" style="width:82px; " align="right">
							<xsl:for-each select="n1:Invoice/cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount">
								<xsl:call-template name="Curr_Type"/>
							</xsl:for-each>
						</td>
					</tr>
					<tr align="right">
						<td/>
						<td class="lineTableBudgetTd" width="200px" align="right">
							<span style="font-weight:bold; ">
								<xsl:text>Ödenecek Tutar</xsl:text>
							</span>
						</td>
						<td class="lineTableBudgetTd" style="width:82px; " align="right">
							<xsl:for-each select="n1:Invoice/cac:LegalMonetaryTotal/cbc:PayableAmount">
								<xsl:call-template name="Curr_Type"/>
							</xsl:for-each>
						</td>
					</tr>
					<xsl:for-each select="n1:Invoice/cac:TaxTotal/cac:TaxSubtotal">
						<xsl:if	test="//n1:Invoice/cbc:DocumentCurrencyCode != 'TRY' and //n1:Invoice/cbc:DocumentCurrencyCode != 'TRL'">
							<tr align="right">
								<td/>
								<td class="lineTableBudgetTd" align="right" width="200px">
									<span style="font-weight:bold; ">
										<xsl:text>Hesaplanan </xsl:text>
										<xsl:value-of select="cac:TaxCategory/cac:TaxScheme/cbc:Name"/>
										<xsl:text>(%</xsl:text>
										<xsl:value-of select="cbc:Percent"/>
										<xsl:text>) (TL)</xsl:text>
									</span>
								</td>
								<td class="lineTableBudgetTd" style="width:81px; " align="right">
									<span>
										<xsl:value-of
											select="format-number(cbc:TaxAmount * //n1:Invoice/cac:PricingExchangeRate/cbc:CalculationRate, '###.##0,00', 'european')"/>
										<xsl:text> TL</xsl:text>
									</span>
								</td>
							</tr>
						</xsl:if>
					</xsl:for-each>					
					<xsl:if
						test="//n1:Invoice/cac:LegalMonetaryTotal/cbc:LineExtensionAmount/@currencyID != 'TRL' and //n1:Invoice/cac:LegalMonetaryTotal/cbc:LineExtensionAmount/@currencyID != 'TRY'">
						<tr align="right">
							<td/>
							<td class="lineTableBudgetTd" align="right" width="200px">
								<span style="font-weight:bold; ">
									<xsl:text>Mal Hizmet Toplam Tutarı(TL)</xsl:text>
								</span>
							</td>
							<td class="lineTableBudgetTd" style="width:81px; " align="right">
								<xsl:value-of
									select="format-number(//n1:Invoice/cac:LegalMonetaryTotal/cbc:LineExtensionAmount * //n1:Invoice/cac:PricingExchangeRate/cbc:CalculationRate, '###.##0,00', 'european')"/>
								<xsl:text> TL</xsl:text>
							</td>
						</tr>
						<tr align="right">
							<td/>
							<td class="lineTableBudgetTd" width="200px" align="right">
								<span style="font-weight:bold; ">
									<xsl:text>Vergiler Dahil Toplam Tutar(TL)</xsl:text>
								</span>
							</td>
							<td class="lineTableBudgetTd" style="width:82px; " align="right">
								<xsl:value-of
									select="format-number(//n1:Invoice/cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount * //n1:Invoice/cac:PricingExchangeRate/cbc:CalculationRate, '###.##0,00', 'european')"/>
								<xsl:text> TL</xsl:text>
							</td>
						</tr>
						<tr align="right">
							<td/>
							<td class="lineTableBudgetTd" width="200px" align="right">
								<span style="font-weight:bold; ">
									<xsl:text>Ödenecek Tutar(TL)</xsl:text>
								</span>
							</td>
							<td class="lineTableBudgetTd" style="width:82px; " align="right">
								<xsl:value-of
									select="format-number(//n1:Invoice/cac:LegalMonetaryTotal/cbc:PayableAmount * //n1:Invoice/cac:PricingExchangeRate/cbc:CalculationRate, '###.##0,00', 'european')"/>
								<xsl:text> TL</xsl:text>
							</td>
						</tr>
					</xsl:if>
				</table>
				<br/>
				<xsl:if test="//n1:Invoice/cac:BillingReference/cac:InvoiceDocumentReference/cbc:DocumentTypeCode[text()='İADE' or text()='IADE']">
					<table id="lineTable" width="800">
						<thead>
							<tr>
								<td align="left"><span style="font-weight:bold; " align="center">&#160;&#160;&#160;&#160;&#160;İadeye Konu Olan Faturalar</span></td>							
							</tr>
						</thead>					
						<tbody>
							<tr align="left" class="lineTableTr">							
								<td class="lineTableTd">
									<span style="font-weight:bold; " align="center">&#160;&#160;&#160;&#160;&#160;Fatura No</span>
								</td>
								<td class="lineTableTd"><span style="font-weight:bold; " align="center">&#160;&#160;&#160;&#160;&#160;Tarih</span></td>
							</tr>
							<xsl:for-each select="//n1:Invoice/cac:BillingReference/cac:InvoiceDocumentReference/cbc:DocumentTypeCode[text()='İADE' or text()='IADE']">
								<tr align="left" class="lineTableTr">
									<td class="lineTableTd">&#160;&#160;&#160;&#160;&#160;
										<xsl:value-of select="../cbc:ID"/> 
									</td>
									<td class="lineTableTd">&#160;&#160;&#160;&#160;&#160;
										<xsl:for-each select="../cbc:IssueDate">
											<xsl:apply-templates select="."/>
										</xsl:for-each> 
									</td>
								</tr>
							</xsl:for-each>
						</tbody>
					</table>
				</xsl:if>
				<br/>
				<xsl:if	test="//n1:Invoice/cac:BillingReference/cac:AdditionalDocumentReference/cbc:DocumentTypeCode='OKCBF'">
					<table border="1" id="lineTable" width="800">
						<thead>
							<tr>
								<th colspan="6">ÖKC Bilgileri</th>
							</tr>
						</thead>							
						<tbody>
							<tr id="okcbfHeadTr" style="font-weight:bold;">
								<td style="width:20%">
									<xsl:text>Fiş Numarası</xsl:text>
								</td>
								<td style="width:10%" align="center">
									<xsl:text>Fiş Tarihi</xsl:text>
								</td>
								<td style="width:10%" align="center">
									<xsl:text>Fiş Saati</xsl:text>
								</td>
								<td style="width:40%" align="center">
									<xsl:text>Fiş Tipi</xsl:text>
								</td>
								<td style="width:10%" align="center">
									<xsl:text>Z Rapor No</xsl:text>
								</td>
								<td style="width:10%" align="center">
									<xsl:text>ÖKC Seri No</xsl:text>
								</td>
							</tr>						
						</tbody>
						<xsl:for-each select="//n1:Invoice/cac:BillingReference/cac:AdditionalDocumentReference/cbc:DocumentTypeCode[text()='OKCBF']">
							<tr>
								<td style="width:20%">
									<xsl:value-of select="../cbc:ID"/>
								</td>
								<td style="width:10%" align="center">
									<xsl:value-of select="../cbc:IssueDate"/>
								</td>
								<td style="width:10%" align="center">
									<xsl:value-of select="substring(../cac:ValidityPeriod/cbc:StartTime,1,5)"/>
								</td>
								<td style="width:40%" align="center">
									<xsl:choose>
										<xsl:when test="../cbc:DocumentDescription='AVANS'">
											<xsl:text>Ön Tahsilat(Avans) Bilgi Fişi</xsl:text>
										</xsl:when>
										<xsl:when test="../cbc:DocumentDescription='YEMEK_FIS'">
											<xsl:text>Yemek Fişi/Kartı ile Yapılan Tahsilat Bilgi Fişi</xsl:text>
										</xsl:when>
										<xsl:when test="../cbc:DocumentDescription='E-FATURA'">
											<xsl:text>E-Fatura Bilgi Fişi</xsl:text>
										</xsl:when>
										<xsl:when test="../cbc:DocumentDescription='E-FATURA_IRSALIYE'">
											<xsl:text>İrsaliye Yerine Geçen E-Fatura Bilgi Fişi</xsl:text>
										</xsl:when>
										<xsl:when test="../cbc:DocumentDescription='E-ARSIV'">
											<xsl:text>E-Arşiv Bilgi Fişi</xsl:text>
										</xsl:when>
										<xsl:when test="../cbc:DocumentDescription='E-ARSIV_IRSALIYE'">
											<xsl:text>İrsaliye Yerine Geçen E-Arşiv Bilgi Fişi</xsl:text>
										</xsl:when>
										<xsl:when test="../cbc:DocumentDescription='FATURA'">
											<xsl:text>Faturalı Satış Bilgi Fişi</xsl:text>
										</xsl:when>
										<xsl:when test="../cbc:DocumentDescription='OTOPARK'">
											<xsl:text>Otopark Giriş Bilgi Fişi</xsl:text>
										</xsl:when>
										<xsl:when test="../cbc:DocumentDescription='FATURA_TAHSILAT'">
											<xsl:text>Fatura Tahsilat Bilgi Fişi</xsl:text>
										</xsl:when>
										<xsl:when test="../cbc:DocumentDescription='FATURA_TAHSILAT_KOMISYONLU'">
											<xsl:text>Komisyonlu Fatura Tahsilat Bilgi Fişi</xsl:text>
										</xsl:when>
										<xsl:otherwise>
											<xsl:text> </xsl:text>
										</xsl:otherwise>
									</xsl:choose>
								</td>
								<td style="width:10%" align="center">
									<xsl:value-of select="../cac:Attachment/cac:ExternalReference/cbc:URI"/>
								</td>
								<td style="width:10%" align="center">
									<xsl:value-of select="../cac:IssuerParty/cbc:EndpointID"/>
								</td>
							</tr>													
						</xsl:for-each>
					</table>
					<br/>
				</xsl:if>				
				<table id="notesTable" width="800" align="left">
					<tbody>
						<tr align="left">
							<td id="notesTableTd" height="100">
								<xsl:for-each select="//n1:Invoice/cac:TaxTotal/cac:TaxSubtotal">
									<xsl:if	test="(cac:TaxCategory/cac:TaxScheme/cbc:TaxTypeCode='0015' or ../../cbc:InvoiceTypeCode='OZELMATRAH') and cac:TaxCategory/cbc:TaxExemptionReason">									
										<b>&#160;&#160;&#160;&#160;&#160; Vergi İstisna Muafiyet Sebebi: </b>
										<xsl:value-of select="cac:TaxCategory/cbc:TaxExemptionReasonCode"/>
										<xsl:text>-</xsl:text>
										<xsl:value-of select="cac:TaxCategory/cbc:TaxExemptionReason"/>
										<br/>
									</xsl:if>
									<xsl:if	test="starts-with(cac:TaxCategory/cac:TaxScheme/cbc:TaxTypeCode,'007') and cac:TaxCategory/cbc:TaxExemptionReason">									
										<b>&#160;&#160;&#160;&#160;&#160; ÖTV İstisna Muafiyet Sebebi: </b>
										<xsl:value-of select="cac:TaxCategory/cbc:TaxExemptionReasonCode"/>
										<xsl:text>-</xsl:text>
										<xsl:value-of select="cac:TaxCategory/cbc:TaxExemptionReason"/>
										<br/>
									</xsl:if>
								</xsl:for-each>
								<xsl:for-each select="//n1:Invoice/cac:WithholdingTaxTotal/cac:TaxSubtotal/cac:TaxCategory/cac:TaxScheme">
									<b>&#160;&#160;&#160;&#160;&#160; Tevkifat Sebebi: </b>
									<xsl:value-of select="cbc:TaxTypeCode"/>
									<xsl:text>-</xsl:text>
									<xsl:value-of select="cbc:Name"/>
									<br/>
								</xsl:for-each>
								<xsl:for-each select="//n1:Invoice/cbc:Note">
									<b>&#160;&#160;&#160;&#160;&#160; Not: </b>
									<xsl:value-of select="."/>	
									<br/>
								</xsl:for-each>									
								<xsl:if test="//n1:Invoice/cac:PaymentMeans/cbc:InstructionNote">
									<b>&#160;&#160;&#160;&#160;&#160; Ödeme Notu: </b>
									<xsl:value-of
										select="//n1:Invoice/cac:PaymentMeans/cbc:InstructionNote"/>
									<br/>
								</xsl:if>
								<xsl:if
									test="//n1:Invoice/cac:PaymentMeans/cac:PayeeFinancialAccount/cbc:PaymentNote">
									<b>&#160;&#160;&#160;&#160;&#160; Hesap Açıklaması: </b>
									<xsl:value-of
										select="//n1:Invoice/cac:PaymentMeans/cac:PayeeFinancialAccount/cbc:PaymentNote"/>
									<br/>
								</xsl:if>
								<xsl:if test="//n1:Invoice/cac:PaymentTerms/cbc:Note">
									<b>&#160;&#160;&#160;&#160;&#160; Ödeme Koşulu: </b>
									<xsl:value-of select="//n1:Invoice/cac:PaymentTerms/cbc:Note"/>
									<br/>
								</xsl:if>
								<xsl:if test="//n1:Invoice/cac:BuyerCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID[@schemeID='PARTYTYPE']='TAXFREE' and //n1:Invoice/cac:TaxRepresentativeParty/cac:PartyTaxScheme/cbc:ExemptionReasonCode">
									<br/>
									<b>&#160;&#160;&#160;&#160;&#160; VAT OFF - NO CASH REFUND </b>
								</xsl:if>
							</td>
						</tr>
					</tbody>
				</table>
				
				<table id="notesTable2" style="margin-top:2px; !important" width="800" align="left"  >
					<tr>
						<td style="color:#5a85a9" align="middle" >Bu Fatura E-Dönüşüm Merkezi EDM Teknolojileri ile Üretilmiştir</td>
					</tr>
				</table>
				
			</body>
		</html>
	</xsl:template>
	<xsl:template match="//n1:Invoice/cac:InvoiceLine">
		<tr class="lineTableTr">
			<td class="lineTableTd">
				<xsl:text>&#160;</xsl:text>
				<xsl:value-of select="./cbc:ID"/>
			</td>
			<td class="lineTableTd">
				<xsl:text>&#160;</xsl:text>
				<xsl:value-of select="./cac:Item/cbc:Name"/>
			</td>
			<td class="lineTableTd" align="right">
				<xsl:text>&#160;</xsl:text>
				<xsl:value-of
					select="format-number(./cbc:InvoicedQuantity, '###.###,####', 'european')"/>
				<xsl:if test="./cbc:InvoicedQuantity/@unitCode">
					<xsl:for-each select="./cbc:InvoicedQuantity">
						<xsl:text> </xsl:text>
						<xsl:choose>
							<xsl:when test="@unitCode  = 'TNE'">
								<xsl:text>ton</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'BX'">
								<xsl:text>Kutu</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'LTR'">
								<xsl:text>lt</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'C62'">
								<xsl:text>Adet</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'KGM'">
								<xsl:text>kg</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'KJO'">
								<xsl:text>kJ</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'GRM'">
								<xsl:text>g</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'MGM'">
								<xsl:text>mg</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'NT'">
								<xsl:text>Net Ton</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'GT'">
								<xsl:text>Gross Ton</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'MTR'">
								<xsl:text>m</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'MMT'">
								<xsl:text>mm</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'KTM'">
								<xsl:text>km</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'MLT'">
								<xsl:text>ml</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'MMQ'">
								<xsl:text>mm3</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'CLT'">
								<xsl:text>cl</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'CMK'">
								<xsl:text>cm2</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'CMQ'">
								<xsl:text>cm3</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'CMT'">
								<xsl:text>cm</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'MTK'">
								<xsl:text>m2</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'MTQ'">
								<xsl:text>m3</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'DAY'">
								<xsl:text> Gün</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'MON'">
								<xsl:text> Ay</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'PA'">
								<xsl:text> Paket</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'KWH'">
								<xsl:text> KWH</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'ANN'">
								<xsl:text> Yıl</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'HUR'">
								<xsl:text> Saat</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'D61'">
								<xsl:text> Dakika</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'D62'">
								<xsl:text> Saniye</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'CCT'">
								<xsl:text> Ton baş.taşıma kap.</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'D30'">
								<xsl:text> Brüt kalori</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'D40'">
								<xsl:text> 1000 lt</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'LPA'">
								<xsl:text> saf alkol lt</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'B32'">
								<xsl:text> kg.m2</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'NCL'">
								<xsl:text> hücre adet</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'PR'">
								<xsl:text> Çift</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'R9'">
								<xsl:text> 1000 m3</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'SET'">
								<xsl:text> Set</xsl:text>
							</xsl:when>
							<xsl:when test="@unitCode  = 'T3'">
								<xsl:text> 1000 adet</xsl:text>
							</xsl:when>		
							<xsl:when test="@unitCode = '5B'">
							<xsl:text>Takım</xsl:text>
							</xsl:when>							
						</xsl:choose>
					</xsl:for-each>
				</xsl:if>
			</td>
			<td class="lineTableTd" align="right">
				<xsl:text>&#160;</xsl:text>
				<xsl:value-of
					select="format-number(./cac:Price/cbc:PriceAmount, '###.##0,########', 'european')"/>
				<xsl:if test="./cac:Price/cbc:PriceAmount/@currencyID">
					<xsl:text> </xsl:text>
					<xsl:if test="./cac:Price/cbc:PriceAmount/@currencyID = &quot;TRL&quot; or ./cac:Price/cbc:PriceAmount/@currencyID = &quot;TRY&quot;">
						<xsl:text>TL</xsl:text>
					</xsl:if>
					<xsl:if test="./cac:Price/cbc:PriceAmount/@currencyID != &quot;TRL&quot; and ./cac:Price/cbc:PriceAmount/@currencyID != &quot;TRY&quot;">
						<xsl:value-of select="./cac:Price/cbc:PriceAmount/@currencyID"/>
					</xsl:if>
				</xsl:if>
			</td>
			<td class="lineTableTd" align="right">
				<xsl:text>&#160;</xsl:text>
				<xsl:for-each select="./cac:AllowanceCharge/cbc:MultiplierFactorNumeric">
					<xsl:text> %</xsl:text>
					<xsl:value-of select="format-number(. * 100, '###.##0,00', 'european')"/>
				</xsl:for-each>
			</td>
			<td class="lineTableTd" align="right">
				<xsl:text>&#160;</xsl:text>
				<xsl:for-each select="cac:AllowanceCharge/cbc:Amount">
					<xsl:call-template name="Curr_Type"/>
				</xsl:for-each>
			</td>
			<td class="lineTableTd" align="right">
				<xsl:text>&#160;</xsl:text>
				<xsl:for-each select="./cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory/cac:TaxScheme">
					<xsl:if test="cbc:TaxTypeCode='0015' ">
						<xsl:text> </xsl:text>
						<xsl:if test="../../cbc:Percent">
							<xsl:text> %</xsl:text>
							<xsl:value-of select="format-number(../../cbc:Percent, '###.##0,00', 'european')"/>
						</xsl:if>
					</xsl:if>
				</xsl:for-each>
			</td>
			<td class="lineTableTd" align="right">
				<xsl:text>&#160;</xsl:text>
				<xsl:for-each
					select="./cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory/cac:TaxScheme">
					<xsl:if test="cbc:TaxTypeCode='0015' ">
						<xsl:text> </xsl:text>
						<xsl:for-each select="../../cbc:TaxAmount">
							<xsl:call-template name="Curr_Type"/>
						</xsl:for-each>
					</xsl:if>
				</xsl:for-each>
			</td>
			<td class="lineTableTd" style="font-size: xx-small" align="right">
				<xsl:text>&#160;</xsl:text>
				<xsl:for-each
					select="./cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory/cac:TaxScheme">
					<xsl:if test="cbc:TaxTypeCode!='0015' ">
						<xsl:text> </xsl:text>
						<xsl:value-of select="cbc:Name"/>
						<xsl:if test="../../cbc:Percent">
							<xsl:text> (%</xsl:text>
							<xsl:value-of
								select="format-number(../../cbc:Percent, '###.##0,00', 'european')"/>
							<xsl:text>)=</xsl:text>
						</xsl:if>					
						<xsl:for-each select="../../cbc:TaxAmount">
							<xsl:call-template name="Curr_Type"/>
						</xsl:for-each>
					</xsl:if>
				</xsl:for-each>
				<xsl:for-each
					select="./cac:WithholdingTaxTotal/cac:TaxSubtotal/cac:TaxCategory/cac:TaxScheme">
					<xsl:text>KDV TEVKİFAT </xsl:text>
					<xsl:if test="../../cbc:Percent">
						<xsl:text> (%</xsl:text>
						<xsl:value-of
							select="format-number(../../cbc:Percent, '###.##0,00', 'european')"/>
						<xsl:text>)=</xsl:text>
					</xsl:if>
					<xsl:for-each select="../../cbc:TaxAmount">
						<xsl:call-template name="Curr_Type"/>
						<xsl:text>&#10;</xsl:text>
					</xsl:for-each>
				</xsl:for-each>
			</td>
			<td class="lineTableTd" align="right">
				<xsl:text>&#160;</xsl:text>
				<xsl:for-each select="cbc:LineExtensionAmount">
					<xsl:call-template name="Curr_Type"/>
				</xsl:for-each>
			</td>
			<xsl:if test="//n1:Invoice/cbc:ProfileID='IHRACAT'">
				<td class="lineTableTd" align="right">
					<xsl:text>&#160;</xsl:text>
					<xsl:for-each select="cac:Delivery/cac:DeliveryTerms/cbc:ID[@schemeID='INCOTERMS']">
						<xsl:text>&#160;</xsl:text>
						<xsl:apply-templates/>
					</xsl:for-each>
				</td>
				<td class="lineTableTd" align="right">
					<xsl:text>&#160;</xsl:text>
					<xsl:for-each select="cac:Delivery/cac:Shipment/cac:TransportHandlingUnit/cac:ActualPackage/cbc:PackagingTypeCode">
						<xsl:text>&#160;</xsl:text>
						<xsl:call-template name="Packaging">
							<xsl:with-param name="PackagingType">
								<xsl:value-of select="."/>
							</xsl:with-param>
						</xsl:call-template>
					</xsl:for-each>
				</td>
				<td class="lineTableTd" align="right">
					<xsl:text>&#160;</xsl:text>
					<xsl:for-each select="cac:Delivery/cac:Shipment/cac:TransportHandlingUnit/cac:ActualPackage/cbc:ID">
						<xsl:text>&#160;</xsl:text>
						<xsl:apply-templates/>
					</xsl:for-each>
				</td>
				<td class="lineTableTd" align="right">
					<xsl:text>&#160;</xsl:text>
					<xsl:for-each select="cac:Delivery/cac:Shipment/cac:TransportHandlingUnit/cac:ActualPackage/cbc:Quantity">
						<xsl:text>&#160;</xsl:text>
						<xsl:apply-templates/>
					</xsl:for-each>
				</td>
				<td class="lineTableTd" align="right">
					<xsl:text>&#160;</xsl:text>
					<xsl:for-each select="cac:Delivery/cac:DeliveryAddress">
						<xsl:text>&#160;</xsl:text>
						<xsl:apply-templates/>
					</xsl:for-each>
				</td>
				<td class="lineTableTd" align="right">
					<xsl:text>&#160;</xsl:text>
					<xsl:for-each select="cac:Delivery/cac:Shipment/cac:ShipmentStage/cbc:TransportModeCode">
						<xsl:text>&#160;</xsl:text>
						<xsl:call-template name="TransportMode">
							<xsl:with-param name="TransportModeType">
								<xsl:value-of select="."/>
							</xsl:with-param>
						</xsl:call-template>
					</xsl:for-each>
				</td>
				<td class="lineTableTd" align="right">
					<xsl:text>&#160;</xsl:text>
					<xsl:for-each select="cac:Delivery/cac:Shipment/cac:GoodsItem/cbc:RequiredCustomsID">
						<xsl:text>&#160;</xsl:text>
						<xsl:apply-templates/>
					</xsl:for-each>
				</td>				
			</xsl:if>			
		</tr>
	</xsl:template>
	<xsl:template match="//cbc:IssueDate">
		<xsl:value-of select="substring(.,9,2)"/>-<xsl:value-of select="substring(.,6,2)"/>-<xsl:value-of select="substring(.,1,4)"/>
	</xsl:template>
	<xsl:template match="//n1:Invoice">
		<tr class="lineTableTr">
			<td class="lineTableTd">
				<xsl:text>&#160;</xsl:text>
			</td>
			<td class="lineTableTd">
				<xsl:text>&#160;</xsl:text>
			</td>
			<td class="lineTableTd" align="right">
				<xsl:text>&#160;</xsl:text>
			</td>
			<td class="lineTableTd" align="right">
				<xsl:text>&#160;</xsl:text>
			</td>
			<td class="lineTableTd" align="right">
				<xsl:text>&#160;</xsl:text>
			</td>
			<td class="lineTableTd" align="right">
				<xsl:text>&#160;</xsl:text>
			</td>
			<td class="lineTableTd" align="right">
				<xsl:text>&#160;</xsl:text>
			</td>
			<td class="lineTableTd" align="right">
				<xsl:text>&#160;</xsl:text>
			</td>
			<td class="lineTableTd" align="right">
				<xsl:text>&#160;</xsl:text>
			</td>
			<td class="lineTableTd" align="right">
				<xsl:text>&#160;</xsl:text>
			</td>
			<xsl:if test="//n1:Invoice/cbc:ProfileID='IHRACAT'">
				<td class="lineTableTd" align="right">
					<xsl:text>&#160;</xsl:text>
				</td>
				<td class="lineTableTd" align="right">
					<xsl:text>&#160;</xsl:text>
				</td>
				<td class="lineTableTd" align="right">
					<xsl:text>&#160;</xsl:text>
				</td>
				<td class="lineTableTd" align="right">
					<xsl:text>&#160;</xsl:text>
				</td>
				<td class="lineTableTd" align="right">
					<xsl:text>&#160;</xsl:text>
				</td>
				<td class="lineTableTd" align="right">
					<xsl:text>&#160;</xsl:text>
				</td>
				<td class="lineTableTd" align="right">
					<xsl:text>&#160;</xsl:text>
				</td>
			</xsl:if>			
		</tr>
	</xsl:template>
	<xsl:template name="Party_Title" >
		<xsl:param name="PartyType" />
		<td style="width:469px; " align="left">
			<xsl:if test="cac:PartyName">
				<xsl:value-of select="cac:PartyName/cbc:Name"/>
				<br/>
			</xsl:if>
			<xsl:for-each select="cac:Person">
				<xsl:for-each select="cbc:Title">
					<xsl:apply-templates/>
					<xsl:text>&#160;</xsl:text>
				</xsl:for-each>
				<xsl:for-each select="cbc:FirstName">
					<xsl:apply-templates/>
					<xsl:text>&#160;</xsl:text>
				</xsl:for-each>
				<xsl:for-each select="cbc:MiddleName">
					<xsl:apply-templates/>
					<xsl:text>&#160; </xsl:text>
				</xsl:for-each>
				<xsl:for-each select="cbc:FamilyName">
					<xsl:apply-templates/>
					<xsl:text>&#160;</xsl:text>
				</xsl:for-each>
				<xsl:for-each select="cbc:NameSuffix">
					<xsl:apply-templates/>
				</xsl:for-each>
				<xsl:if test="$PartyType='TAXFREE'">
					<br/>
					<xsl:text>Pasaport No: </xsl:text>
					<xsl:value-of select="cac:IdentityDocumentReference/cbc:ID"/>
					<br/>
					<xsl:text>Ülkesi: </xsl:text>
					<xsl:for-each select="cbc:NationalityID">
						<xsl:call-template name="Country">
							<xsl:with-param name="CountryType"><xsl:value-of select="."/></xsl:with-param>
						</xsl:call-template>
					</xsl:for-each>
				</xsl:if>
			</xsl:for-each>
		</td>		
	</xsl:template>
	<xsl:template name="Party_Adress" >
		<xsl:param name="PartyType" />
		<td style="width:469px; " align="left">
			<xsl:for-each select="cac:PostalAddress">
				<xsl:for-each select="cbc:StreetName">
					<xsl:apply-templates/>
					<xsl:text>&#160;</xsl:text>
				</xsl:for-each>
				<xsl:for-each select="cbc:BuildingName">
					<xsl:apply-templates/>
				</xsl:for-each>
				<xsl:for-each select="cbc:BuildingNumber">
					<xsl:text> No:</xsl:text>
					<xsl:apply-templates/>
					<xsl:text>&#160;</xsl:text>
				</xsl:for-each>
				<br/>
				<xsl:for-each select="cbc:Room">
					<xsl:text>Kapı No:</xsl:text>
					<xsl:apply-templates/>
					<xsl:text>&#160;</xsl:text>
				</xsl:for-each>
				<br/>
				<xsl:for-each select="cbc:PostalZone">
					<xsl:apply-templates/>
					<xsl:text>&#160;</xsl:text>
				</xsl:for-each>
				<xsl:for-each select="cbc:CitySubdivisionName">
					<xsl:apply-templates/>
					<xsl:text>/ </xsl:text>
				</xsl:for-each>
				<xsl:for-each select="cbc:CityName">
					<xsl:apply-templates/>
					<xsl:text>&#160;</xsl:text>
				</xsl:for-each>
				<xsl:if test="$PartyType!='OTHER'">
					<br/>
					<xsl:value-of select="cac:Country/cbc:Name"/>
					<br/>
				</xsl:if>
			</xsl:for-each>
		</td>
	</xsl:template>
	<xsl:template name="TransportMode">
		<xsl:param name="TransportModeType" />
		<xsl:choose>
			<xsl:when test="$TransportModeType=1">Denizyolu</xsl:when>
			<xsl:when test="$TransportModeType=2">Demiryolu</xsl:when>
			<xsl:when test="$TransportModeType=3">Karayolu</xsl:when>
			<xsl:when test="$TransportModeType=4">Havayolu</xsl:when>
			<xsl:when test="$TransportModeType=5">Posta</xsl:when>
			<xsl:when test="$TransportModeType=6">Çok araçlı</xsl:when>
			<xsl:when test="$TransportModeType=7">Sabit taşıma tesisleri</xsl:when>
			<xsl:when test="$TransportModeType=8">İç su taşımacılığı</xsl:when>			
			<xsl:otherwise><xsl:value-of select="$TransportModeType"/></xsl:otherwise>
		</xsl:choose>		
	</xsl:template>
	<xsl:template name="Packaging">
		<xsl:param name="PackagingType" />
		<xsl:choose>
			<xsl:when test="$PackagingType='1A'">Drum, steel</xsl:when>
			<xsl:when test="$PackagingType='1B'">Drum, aluminium</xsl:when>
			<xsl:when test="$PackagingType='1D'">Drum, plywood</xsl:when>
			<xsl:when test="$PackagingType='1F'">Container, flexible</xsl:when>
			<xsl:when test="$PackagingType='1G'">Drum, fibre</xsl:when>
			<xsl:when test="$PackagingType='1W'">Drum, wooden</xsl:when>
			<xsl:when test="$PackagingType='2C'">Barrel, wooden</xsl:when>
			<xsl:when test="$PackagingType='3A'">Jerrican, steel</xsl:when>
			<xsl:when test="$PackagingType='3H'">Jerrican, plastic</xsl:when>
			<xsl:when test="$PackagingType='43'">Bag, super bulk</xsl:when>
			<xsl:when test="$PackagingType='44'">Bag, polybag</xsl:when>
			<xsl:when test="$PackagingType='4A'">Box, steel</xsl:when>
			<xsl:when test="$PackagingType='4B'">Box, aluminium</xsl:when>
			<xsl:when test="$PackagingType='4C'">Box, natural wood</xsl:when>
			<xsl:when test="$PackagingType='4D'">Box, plywood</xsl:when>
			<xsl:when test="$PackagingType='4F'">Box, reconstituted wood</xsl:when>
			<xsl:when test="$PackagingType='4G'">Box, fibreboard</xsl:when>
			<xsl:when test="$PackagingType='4H'">Box, plastic</xsl:when>
			<xsl:when test="$PackagingType='5H'">Bag, woven plastic</xsl:when>
			<xsl:when test="$PackagingType='5L'">Bag, textile</xsl:when>
			<xsl:when test="$PackagingType='5M'">Bag, paper</xsl:when>
			<xsl:when test="$PackagingType='6H'">Composite packaging, plastic receptacle</xsl:when>
			<xsl:when test="$PackagingType='6P'">Composite packaging, glass receptacle</xsl:when>
			<xsl:when test="$PackagingType='7A'">Case, car</xsl:when>
			<xsl:when test="$PackagingType='7B'">Case, wooden</xsl:when>
			<xsl:when test="$PackagingType='8A'">Pallet, wooden</xsl:when>
			<xsl:when test="$PackagingType='8B'">Crate, wooden</xsl:when>
			<xsl:when test="$PackagingType='8C'">Bundle, wooden</xsl:when>
			<xsl:when test="$PackagingType='AA'">Intermediate bulk container, rigid plastic</xsl:when>
			<xsl:when test="$PackagingType='AB'">Receptacle, fibre</xsl:when>
			<xsl:when test="$PackagingType='AC'">Receptacle, paper</xsl:when>
			<xsl:when test="$PackagingType='AD'">Receptacle, wooden</xsl:when>
			<xsl:when test="$PackagingType='AE'">Aerosol</xsl:when>
			<xsl:when test="$PackagingType='AF'">Pallet, modular, collars 80cms * 60cms</xsl:when>
			<xsl:when test="$PackagingType='AG'">Pallet, shrinkwrapped</xsl:when>
			<xsl:when test="$PackagingType='AH'">Pallet, 100cms * 110cms</xsl:when>
			<xsl:when test="$PackagingType='AI'">Clamshell</xsl:when>
			<xsl:when test="$PackagingType='AJ'">Cone</xsl:when>
			<xsl:when test="$PackagingType='AL'">Ball</xsl:when>
			<xsl:when test="$PackagingType='AM'">Ampoule, non-protected</xsl:when>
			<xsl:when test="$PackagingType='AP'">Ampoule, protected</xsl:when>
			<xsl:when test="$PackagingType='AT'">Atomizer</xsl:when>
			<xsl:when test="$PackagingType='AV'">Capsule</xsl:when>
			<xsl:when test="$PackagingType='B4'">Belt</xsl:when>
			<xsl:when test="$PackagingType='BA'">Barrel</xsl:when>
			<xsl:when test="$PackagingType='BB'">Bobbin</xsl:when>
			<xsl:when test="$PackagingType='BC'">Bottlecrate / bottlerack</xsl:when>
			<xsl:when test="$PackagingType='BD'">Board</xsl:when>
			<xsl:when test="$PackagingType='BE'">Bundle</xsl:when>
			<xsl:when test="$PackagingType='BF'">Balloon, non-protected</xsl:when>
			<xsl:when test="$PackagingType='BG'">Bag</xsl:when>
			<xsl:when test="$PackagingType='BH'">Bunch</xsl:when>
			<xsl:when test="$PackagingType='BI'">Bin</xsl:when>
			<xsl:when test="$PackagingType='BJ'">Bucket</xsl:when>
			<xsl:when test="$PackagingType='BK'">Basket</xsl:when>
			<xsl:when test="$PackagingType='BL'">Bale, compressed</xsl:when>
			<xsl:when test="$PackagingType='BM'">Basin</xsl:when>
			<xsl:when test="$PackagingType='BN'">Bale, non-compressed</xsl:when>
			<xsl:when test="$PackagingType='BO'">Bottle, non-protected, cylindrical</xsl:when>
			<xsl:when test="$PackagingType='BP'">Balloon, protected</xsl:when>
			<xsl:when test="$PackagingType='BQ'">Bottle, protected cylindrical</xsl:when>
			<xsl:when test="$PackagingType='BR'">Bar</xsl:when>
			<xsl:when test="$PackagingType='BS'">Bottle, non-protected, bulbous</xsl:when>
			<xsl:when test="$PackagingType='BT'">Bolt</xsl:when>
			<xsl:when test="$PackagingType='BU'">Butt</xsl:when>
			<xsl:when test="$PackagingType='BV'">Bottle, protected bulbous</xsl:when>
			<xsl:when test="$PackagingType='BW'">Box, for liquids</xsl:when>
			<xsl:when test="$PackagingType='BX'">Box</xsl:when>
			<xsl:when test="$PackagingType='BY'">Board, in bundle/bunch/truss</xsl:when>
			<xsl:when test="$PackagingType='BZ'">Bars, in bundle/bunch/truss</xsl:when>
			<xsl:when test="$PackagingType='CA'">Can, rectangular</xsl:when>
			<xsl:when test="$PackagingType='CB'">Crate, beer</xsl:when>
			<xsl:when test="$PackagingType='CC'">Churn</xsl:when>
			<xsl:when test="$PackagingType='CD'">Can, with handle and spout</xsl:when>
			<xsl:when test="$PackagingType='CE'">Creel</xsl:when>
			<xsl:when test="$PackagingType='CF'">Coffer</xsl:when>
			<xsl:when test="$PackagingType='CG'">Cage</xsl:when>
			<xsl:when test="$PackagingType='CH'">Chest</xsl:when>
			<xsl:when test="$PackagingType='CI'">Canister</xsl:when>
			<xsl:when test="$PackagingType='CJ'">Coffin</xsl:when>
			<xsl:when test="$PackagingType='CK'">Cask</xsl:when>
			<xsl:when test="$PackagingType='CL'">Coil</xsl:when>
			<xsl:when test="$PackagingType='CM'">Card</xsl:when>
			<xsl:when test="$PackagingType='CN'">Container, not otherwise specified as transport equipment</xsl:when>
			<xsl:when test="$PackagingType='CO'">Carboy, non-protected</xsl:when>
			<xsl:when test="$PackagingType='CP'">Carboy, protected</xsl:when>
			<xsl:when test="$PackagingType='CQ'">Cartridge</xsl:when>
			<xsl:when test="$PackagingType='CR'">Crate</xsl:when>
			<xsl:when test="$PackagingType='CS'">Case</xsl:when>
			<xsl:when test="$PackagingType='CT'">Carton</xsl:when>
			<xsl:when test="$PackagingType='CU'">Cup</xsl:when>
			<xsl:when test="$PackagingType='CV'">Cover</xsl:when>
			<xsl:when test="$PackagingType='CW'">Cage, roll</xsl:when>
			<xsl:when test="$PackagingType='CX'">Can, cylindrical</xsl:when>
			<xsl:when test="$PackagingType='CY'">Cylinder</xsl:when>
			<xsl:when test="$PackagingType='CZ'">Canvas</xsl:when>
			<xsl:when test="$PackagingType='DA'">Crate, multiple layer, plastic</xsl:when>
			<xsl:when test="$PackagingType='DB'">Crate, multiple layer, wooden</xsl:when>
			<xsl:when test="$PackagingType='DC'">Crate, multiple layer, cardboard</xsl:when>
			<xsl:when test="$PackagingType='DG'">Cage, Commonwealth Handling Equipment Pool (CHEP)</xsl:when>
			<xsl:when test="$PackagingType='DH'">Box, Commonwealth Handling Equipment Pool (CHEP), Eurobox</xsl:when>
			<xsl:when test="$PackagingType='DI'">Drum, iron</xsl:when>
			<xsl:when test="$PackagingType='DJ'">Demijohn, non-protected</xsl:when>
			<xsl:when test="$PackagingType='DK'">Crate, bulk, cardboard</xsl:when>
			<xsl:when test="$PackagingType='DL'">Crate, bulk, plastic</xsl:when>
			<xsl:when test="$PackagingType='DM'">Crate, bulk, wooden</xsl:when>
			<xsl:when test="$PackagingType='DN'">Dispenser</xsl:when>
			<xsl:when test="$PackagingType='DP'">Demijohn, protected</xsl:when>
			<xsl:when test="$PackagingType='DR'">Drum</xsl:when>
			<xsl:when test="$PackagingType='DS'">Tray, one layer no cover, plastic</xsl:when>
			<xsl:when test="$PackagingType='DT'">Tray, one layer no cover, wooden</xsl:when>
			<xsl:when test="$PackagingType='DU'">Tray, one layer no cover, polystyrene</xsl:when>
			<xsl:when test="$PackagingType='DV'">Tray, one layer no cover, cardboard</xsl:when>
			<xsl:when test="$PackagingType='DW'">Tray, two layers no cover, plastic tray</xsl:when>
			<xsl:when test="$PackagingType='DX'">Tray, two layers no cover, wooden</xsl:when>
			<xsl:when test="$PackagingType='DY'">Tray, two layers no cover, cardboard</xsl:when>
			<xsl:when test="$PackagingType='EC'">Bag, plastic</xsl:when>
			<xsl:when test="$PackagingType='ED'">Case, with pallet base</xsl:when>
			<xsl:when test="$PackagingType='EE'">Case, with pallet base, wooden</xsl:when>
			<xsl:when test="$PackagingType='EF'">Case, with pallet base, cardboard</xsl:when>
			<xsl:when test="$PackagingType='EG'">Case, with pallet base, plastic</xsl:when>
			<xsl:when test="$PackagingType='EH'">Case, with pallet base, metal</xsl:when>
			<xsl:when test="$PackagingType='EI'">Case, isothermic</xsl:when>
			<xsl:when test="$PackagingType='EN'">Envelope</xsl:when>
			<xsl:when test="$PackagingType='FB'">Flexibag</xsl:when>
			<xsl:when test="$PackagingType='FC'">Crate, fruit</xsl:when>
			<xsl:when test="$PackagingType='FD'">Crate, framed</xsl:when>
			<xsl:when test="$PackagingType='FE'">Flexitank</xsl:when>
			<xsl:when test="$PackagingType='FI'">Firkin</xsl:when>
			<xsl:when test="$PackagingType='FL'">Flask</xsl:when>
			<xsl:when test="$PackagingType='FO'">Footlocker</xsl:when>
			<xsl:when test="$PackagingType='FP'">Filmpack</xsl:when>
			<xsl:when test="$PackagingType='FR'">Frame</xsl:when>
			<xsl:when test="$PackagingType='FT'">Foodtainer</xsl:when>
			<xsl:when test="$PackagingType='FW'">Cart, flatbed</xsl:when>
			<xsl:when test="$PackagingType='FX'">Bag, flexible container</xsl:when>
			<xsl:when test="$PackagingType='GB'">Bottle, gas</xsl:when>
			<xsl:when test="$PackagingType='GI'">Girder</xsl:when>
			<xsl:when test="$PackagingType='GL'">Container, gallon</xsl:when>
			<xsl:when test="$PackagingType='GR'">Receptacle, glass</xsl:when>
			<xsl:when test="$PackagingType='GU'">Tray, containing horizontally stacked flat items</xsl:when>
			<xsl:when test="$PackagingType='GY'">Bag, gunny</xsl:when>
			<xsl:when test="$PackagingType='GZ'">Girders, in bundle/bunch/truss</xsl:when>
			<xsl:when test="$PackagingType='HA'">Basket, with handle, plastic</xsl:when>
			<xsl:when test="$PackagingType='HB'">Basket, with handle, wooden</xsl:when>
			<xsl:when test="$PackagingType='HC'">Basket, with handle, cardboard</xsl:when>
			<xsl:when test="$PackagingType='HG'">Hogshead</xsl:when>
			<xsl:when test="$PackagingType='HN'">Hanger</xsl:when>
			<xsl:when test="$PackagingType='HR'">Hamper</xsl:when>
			<xsl:when test="$PackagingType='IA'">Package, display, wooden</xsl:when>
			<xsl:when test="$PackagingType='IB'">Package, display, cardboard</xsl:when>
			<xsl:when test="$PackagingType='IC'">Package, display, plastic</xsl:when>
			<xsl:when test="$PackagingType='ID'">Package, display, metal</xsl:when>
			<xsl:when test="$PackagingType='IE'">Package, show</xsl:when>
			<xsl:when test="$PackagingType='IF'">Package, flow</xsl:when>
			<xsl:when test="$PackagingType='IG'">Package, paper wrapped</xsl:when>
			<xsl:when test="$PackagingType='IH'">Drum, plastic</xsl:when>
			<xsl:when test="$PackagingType='IK'">Package, cardboard, with bottle grip-holes</xsl:when>
			<xsl:when test="$PackagingType='IL'">Tray, rigid, lidded stackable (CEN TS 14482:2002)</xsl:when>
			<xsl:when test="$PackagingType='IN'">Ingot</xsl:when>
			<xsl:when test="$PackagingType='IZ'">Ingots, in bundle/bunch/truss</xsl:when>
			<xsl:when test="$PackagingType='JB'">Bag, jumbo</xsl:when>
			<xsl:when test="$PackagingType='JC'">Jerrican, rectangular</xsl:when>
			<xsl:when test="$PackagingType='JG'">Jug</xsl:when>
			<xsl:when test="$PackagingType='JR'">Jar</xsl:when>
			<xsl:when test="$PackagingType='JT'">Jutebag</xsl:when>
			<xsl:when test="$PackagingType='JY'">Jerrican, cylindrical</xsl:when>
			<xsl:when test="$PackagingType='KG'">Keg</xsl:when>
			<xsl:when test="$PackagingType='KI'">Kit</xsl:when>
			<xsl:when test="$PackagingType='LE'">Luggage</xsl:when>
			<xsl:when test="$PackagingType='LG'">Log</xsl:when>
			<xsl:when test="$PackagingType='LT'">Lot</xsl:when>
			<xsl:when test="$PackagingType='LU'">Lug</xsl:when>
			<xsl:when test="$PackagingType='LV'">Liftvan</xsl:when>
			<xsl:when test="$PackagingType='LZ'">Logs, in bundle/bunch/truss</xsl:when>
			<xsl:when test="$PackagingType='MA'">Crate, metal</xsl:when>
			<xsl:when test="$PackagingType='MB'">Bag, multiply</xsl:when>
			<xsl:when test="$PackagingType='MC'">Crate, milk</xsl:when>
			<xsl:when test="$PackagingType='ME'">Container, metal</xsl:when>
			<xsl:when test="$PackagingType='MR'">Receptacle, metal</xsl:when>
			<xsl:when test="$PackagingType='MS'">Sack, multi-wall</xsl:when>
			<xsl:when test="$PackagingType='MT'">Mat</xsl:when>
			<xsl:when test="$PackagingType='MW'">Receptacle, plastic wrapped</xsl:when>
			<xsl:when test="$PackagingType='MX'">Matchbox</xsl:when>
			<xsl:when test="$PackagingType='NA'">Not available</xsl:when>
			<xsl:when test="$PackagingType='NE'">Unpacked or unpackaged</xsl:when>
			<xsl:when test="$PackagingType='NF'">Unpacked or unpackaged, single unit</xsl:when>
			<xsl:when test="$PackagingType='NG'">Unpacked or unpackaged, multiple units</xsl:when>
			<xsl:when test="$PackagingType='NS'">Nest</xsl:when>
			<xsl:when test="$PackagingType='NT'">Net</xsl:when>
			<xsl:when test="$PackagingType='NU'">Net, tube, plastic</xsl:when>
			<xsl:when test="$PackagingType='NV'">Net, tube, textile</xsl:when>
			<xsl:when test="$PackagingType='OA'">Pallet, CHEP 40 cm x 60 cm</xsl:when>
			<xsl:when test="$PackagingType='OB'">Pallet, CHEP 80 cm x 120 cm</xsl:when>
			<xsl:when test="$PackagingType='OC'">Pallet, CHEP 100 cm x 120 cm</xsl:when>
			<xsl:when test="$PackagingType='OD'">Pallet, AS 4068-1993</xsl:when>
			<xsl:when test="$PackagingType='OE'">Pallet, ISO T11</xsl:when>
			<xsl:when test="$PackagingType='OF'">Platform, unspecified weight or dimension</xsl:when>
			<xsl:when test="$PackagingType='OK'">Block</xsl:when>
			<xsl:when test="$PackagingType='OT'">Octabin</xsl:when>
			<xsl:when test="$PackagingType='OU'">Container, outer</xsl:when>
			<xsl:when test="$PackagingType='P2'">Pan</xsl:when>
			<xsl:when test="$PackagingType='PA'">Packet</xsl:when>
			<xsl:when test="$PackagingType='PB'">Pallet, box Combined open-ended box and pallet</xsl:when>
			<xsl:when test="$PackagingType='PC'">Parcel</xsl:when>
			<xsl:when test="$PackagingType='PD'">Pallet, modular, collars 80cms * 100cms</xsl:when>
			<xsl:when test="$PackagingType='PE'">Pallet, modular, collars 80cms * 120cms</xsl:when>
			<xsl:when test="$PackagingType='PF'">Pen</xsl:when>
			<xsl:when test="$PackagingType='PG'">Plate</xsl:when>
			<xsl:when test="$PackagingType='PH'">Pitcher</xsl:when>
			<xsl:when test="$PackagingType='PI'">Pipe</xsl:when>
			<xsl:when test="$PackagingType='PJ'">Punnet</xsl:when>
			<xsl:when test="$PackagingType='PK'">Package</xsl:when>
			<xsl:when test="$PackagingType='PL'">Pail</xsl:when>
			<xsl:when test="$PackagingType='PN'">Plank</xsl:when>
			<xsl:when test="$PackagingType='PO'">Pouch</xsl:when>
			<xsl:when test="$PackagingType='PP'">Piece</xsl:when>
			<xsl:when test="$PackagingType='PR'">Receptacle, plastic</xsl:when>
			<xsl:when test="$PackagingType='PT'">Pot</xsl:when>
			<xsl:when test="$PackagingType='PU'">Tray</xsl:when>
			<xsl:when test="$PackagingType='PV'">Pipes, in bundle/bunch/truss</xsl:when>
			<xsl:when test="$PackagingType='PX'">Pallet</xsl:when>
			<xsl:when test="$PackagingType='PY'">Plates, in bundle/bunch/truss</xsl:when>
			<xsl:when test="$PackagingType='PZ'">Planks, in bundle/bunch/truss</xsl:when>
			<xsl:when test="$PackagingType='QA'">Drum, steel, non-removable head</xsl:when>
			<xsl:when test="$PackagingType='QB'">Drum, steel, removable head</xsl:when>
			<xsl:when test="$PackagingType='QC'">Drum, aluminium, non-removable head</xsl:when>
			<xsl:when test="$PackagingType='QD'">Drum, aluminium, removable head</xsl:when>
			<xsl:when test="$PackagingType='QF'">Drum, plastic, non-removable head</xsl:when>
			<xsl:when test="$PackagingType='QG'">Drum, plastic, removable head</xsl:when>
			<xsl:when test="$PackagingType='QH'">Barrel, wooden, bung type</xsl:when>
			<xsl:when test="$PackagingType='QJ'">Barrel, wooden, removable head</xsl:when>
			<xsl:when test="$PackagingType='QK'">Jerrican, steel, non-removable head</xsl:when>
			<xsl:when test="$PackagingType='QL'">Jerrican, steel, removable head</xsl:when>
			<xsl:when test="$PackagingType='QM'">Jerrican, plastic, non-removable head</xsl:when>
			<xsl:when test="$PackagingType='QN'">Jerrican, plastic, removable head</xsl:when>
			<xsl:when test="$PackagingType='QP'">Box, wooden, natural wood, ordinary</xsl:when>
			<xsl:when test="$PackagingType='QQ'">Box, wooden, natural wood, with sift proof walls</xsl:when>
			<xsl:when test="$PackagingType='QR'">Box, plastic, expanded</xsl:when>
			<xsl:when test="$PackagingType='QS'">Box, plastic, solid</xsl:when>
			<xsl:when test="$PackagingType='RD'">Rod</xsl:when>
			<xsl:when test="$PackagingType='RG'">Ring</xsl:when>
			<xsl:when test="$PackagingType='RJ'">Rack, clothing hanger</xsl:when>
			<xsl:when test="$PackagingType='RK'">Rack</xsl:when>
			<xsl:when test="$PackagingType='RL'">Reel</xsl:when>
			<xsl:when test="$PackagingType='RO'">Roll</xsl:when>
			<xsl:when test="$PackagingType='RT'">Rednet</xsl:when>
			<xsl:when test="$PackagingType='RZ'">Rods, in bundle/bunch/truss</xsl:when>
			<xsl:when test="$PackagingType='SA'">Sack</xsl:when>
			<xsl:when test="$PackagingType='SB'">Slab</xsl:when>
			<xsl:when test="$PackagingType='SC'">Crate, shallow</xsl:when>
			<xsl:when test="$PackagingType='SD'">Spindle</xsl:when>
			<xsl:when test="$PackagingType='SE'">Sea-chest</xsl:when>
			<xsl:when test="$PackagingType='SH'">Sachet</xsl:when>
			<xsl:when test="$PackagingType='SI'">Skid</xsl:when>
			<xsl:when test="$PackagingType='SK'">Case, skeleton</xsl:when>
			<xsl:when test="$PackagingType='SL'">Slipsheet</xsl:when>
			<xsl:when test="$PackagingType='SM'">Sheetmetal</xsl:when>
			<xsl:when test="$PackagingType='SO'">Spool</xsl:when>
			<xsl:when test="$PackagingType='SP'">Sheet, plastic wrapping</xsl:when>
			<xsl:when test="$PackagingType='SS'">Case, steel</xsl:when>
			<xsl:when test="$PackagingType='ST'">Sheet</xsl:when>
			<xsl:when test="$PackagingType='SU'">Suitcase</xsl:when>
			<xsl:when test="$PackagingType='SV'">Envelope, steel</xsl:when>
			<xsl:when test="$PackagingType='SW'">Shrinkwrapped</xsl:when>
			<xsl:when test="$PackagingType='SX'">Set</xsl:when>
			<xsl:when test="$PackagingType='SY'">Sleeve</xsl:when>
			<xsl:when test="$PackagingType='SZ'">Sheets, in bundle/bunch/truss</xsl:when>
			<xsl:when test="$PackagingType='T1'">Tablet</xsl:when>
			<xsl:when test="$PackagingType='TB'">Tub</xsl:when>
			<xsl:when test="$PackagingType='TC'">Tea-chest</xsl:when>
			<xsl:when test="$PackagingType='TD'">Tube, collapsible</xsl:when>
			<xsl:when test="$PackagingType='TE'">Tyre</xsl:when>
			<xsl:when test="$PackagingType='TG'">Tank container, generic</xsl:when>
			<xsl:when test="$PackagingType='TI'">Tierce</xsl:when>
			<xsl:when test="$PackagingType='TK'">Tank, rectangular</xsl:when>
			<xsl:when test="$PackagingType='TL'">Tub, with lid</xsl:when>
			<xsl:when test="$PackagingType='TN'">Tin</xsl:when>
			<xsl:when test="$PackagingType='TO'">Tun</xsl:when>
			<xsl:when test="$PackagingType='TR'">Trunk</xsl:when>
			<xsl:when test="$PackagingType='TS'">Truss</xsl:when>
			<xsl:when test="$PackagingType='TT'">Bag, tote</xsl:when>
			<xsl:when test="$PackagingType='TU'">Tube</xsl:when>
			<xsl:when test="$PackagingType='TV'">Tube, with nozzle</xsl:when>
			<xsl:when test="$PackagingType='TW'">Pallet, triwall</xsl:when>
			<xsl:when test="$PackagingType='TY'">Tank, cylindrical</xsl:when>
			<xsl:when test="$PackagingType='TZ'">Tubes, in bundle/bunch/truss</xsl:when>
			<xsl:when test="$PackagingType='UC'">Uncaged</xsl:when>
			<xsl:when test="$PackagingType='UN'">Unit</xsl:when>
			<xsl:when test="$PackagingType='VA'">Vat</xsl:when>
			<xsl:when test="$PackagingType='VG'">Bulk, gas (at 1031 mbar and 15Â°C)</xsl:when>
			<xsl:when test="$PackagingType='VI'">Vial</xsl:when>
			<xsl:when test="$PackagingType='VK'">Vanpack</xsl:when>
			<xsl:when test="$PackagingType='VL'">Bulk, liquid</xsl:when>
			<xsl:when test="$PackagingType='VO'">Bulk, solid, large particles (Â“nodulesÂ”)</xsl:when>
			<xsl:when test="$PackagingType='VP'">Vacuum-packed</xsl:when>
			<xsl:when test="$PackagingType='VQ'">Bulk, liquefied gas (at abnormal temperature/pressure)</xsl:when>
			<xsl:when test="$PackagingType='VN'">Vehicle</xsl:when>
			<xsl:when test="$PackagingType='VR'">Bulk, solid, granular particles (Â“grainsÂ”)</xsl:when>
			<xsl:when test="$PackagingType='VS'">Bulk, scrap metal</xsl:when>
			<xsl:when test="$PackagingType='VY'">Bulk, solid, fine particles (Â“powdersÂ”)</xsl:when>
			<xsl:when test="$PackagingType='WA'">Intermediate bulk container</xsl:when>
			<xsl:when test="$PackagingType='WB'">Wickerbottle</xsl:when>
			<xsl:when test="$PackagingType='WC'">Intermediate bulk container, steel</xsl:when>
			<xsl:when test="$PackagingType='WD'">Intermediate bulk container, aluminium</xsl:when>
			<xsl:when test="$PackagingType='WF'">Intermediate bulk container, metal</xsl:when>
			<xsl:when test="$PackagingType='WG'">Intermediate bulk container, steel, pressurised > 10 kpa</xsl:when>
			<xsl:when test="$PackagingType='WH'">Intermediate bulk container, aluminium, pressurised > 10 kpa</xsl:when>
			<xsl:when test="$PackagingType='WJ'">Intermediate bulk container, metal, pressure 10 kpa</xsl:when>
			<xsl:when test="$PackagingType='WK'">Intermediate bulk container, steel, liquid</xsl:when>
			<xsl:when test="$PackagingType='WL'">Intermediate bulk container, aluminium, liquid</xsl:when>
			<xsl:when test="$PackagingType='WM'">Intermediate bulk container, metal, liquid</xsl:when>
			<xsl:when test="$PackagingType='WN'">Intermediate bulk container, woven plastic, without coat/liner</xsl:when>
			<xsl:when test="$PackagingType='WP'">Intermediate bulk container, woven plastic, coated</xsl:when>
			<xsl:when test="$PackagingType='WQ'">Intermediate bulk container, woven plastic, with liner</xsl:when>
			<xsl:when test="$PackagingType='WR'">Intermediate bulk container, woven plastic, coated and liner</xsl:when>
			<xsl:when test="$PackagingType='WS'">Intermediate bulk container, plastic film</xsl:when>
			<xsl:when test="$PackagingType='WT'">Intermediate bulk container, textile with out coat/liner</xsl:when>
			<xsl:when test="$PackagingType='WU'">Intermediate bulk container, natural wood, with inner liner</xsl:when>
			<xsl:when test="$PackagingType='WV'">Intermediate bulk container, textile, coated</xsl:when>
			<xsl:when test="$PackagingType='WW'">Intermediate bulk container, textile, with liner</xsl:when>
			<xsl:when test="$PackagingType='WX'">Intermediate bulk container, textile, coated and liner</xsl:when>
			<xsl:when test="$PackagingType='WY'">Intermediate bulk container, plywood, with inner liner</xsl:when>
			<xsl:when test="$PackagingType='WZ'">Intermediate bulk container, reconstituted wood, with inner liner</xsl:when>
			<xsl:when test="$PackagingType='XA'">Bag, woven plastic, without inner coat/liner</xsl:when>
			<xsl:when test="$PackagingType='XB'">Bag, woven plastic, sift proof</xsl:when>
			<xsl:when test="$PackagingType='XC'">Bag, woven plastic, water resistant</xsl:when>
			<xsl:when test="$PackagingType='XD'">Bag, plastics film</xsl:when>
			<xsl:when test="$PackagingType='XF'">Bag, textile, without inner coat/liner</xsl:when>
			<xsl:when test="$PackagingType='XG'">Bag, textile, sift proof</xsl:when>
			<xsl:when test="$PackagingType='XH'">Bag, textile, water resistant</xsl:when>
			<xsl:when test="$PackagingType='XJ'">Bag, paper, multi-wall</xsl:when>
			<xsl:when test="$PackagingType='XK'">Bag, paper, multi-wall, water resistant</xsl:when>
			<xsl:when test="$PackagingType='YA'">Composite packaging, plastic receptacle in steel drum</xsl:when>
			<xsl:when test="$PackagingType='YB'">Composite packaging, plastic receptacle in steel crate box</xsl:when>
			<xsl:when test="$PackagingType='YC'">Composite packaging, plastic receptacle in aluminium drum</xsl:when>
			<xsl:when test="$PackagingType='YD'">Composite packaging, plastic receptacle in aluminium crate</xsl:when>
			<xsl:when test="$PackagingType='YF'">Composite packaging, plastic receptacle in wooden box</xsl:when>
			<xsl:when test="$PackagingType='YG'">Composite packaging, plastic receptacle in plywood drum</xsl:when>
			<xsl:when test="$PackagingType='YH'">Composite packaging, plastic receptacle in plywood box</xsl:when>
			<xsl:when test="$PackagingType='YJ'">Composite packaging, plastic receptacle in fibre drum</xsl:when>
			<xsl:when test="$PackagingType='YK'">Composite packaging, plastic receptacle in fibreboard box</xsl:when>
			<xsl:when test="$PackagingType='YL'">Composite packaging, plastic receptacle in plastic drum</xsl:when>
			<xsl:when test="$PackagingType='YM'">Composite packaging, plastic receptacle in solid plastic box</xsl:when>
			<xsl:when test="$PackagingType='YN'">Composite packaging, glass receptacle in steel drum</xsl:when>
			<xsl:when test="$PackagingType='YP'">Composite packaging, glass receptacle in steel crate box</xsl:when>
			<xsl:when test="$PackagingType='YQ'">Composite packaging, glass receptacle in aluminium drum</xsl:when>
			<xsl:when test="$PackagingType='YR'">Composite packaging, glass receptacle in aluminium crate</xsl:when>
			<xsl:when test="$PackagingType='YS'">Composite packaging, glass receptacle in wooden box</xsl:when>
			<xsl:when test="$PackagingType='YT'">Composite packaging, glass receptacle in plywood drum</xsl:when>
			<xsl:when test="$PackagingType='YV'">Composite packaging, glass receptacle in wickerwork hamper</xsl:when>
			<xsl:when test="$PackagingType='YW'">Composite packaging, glass receptacle in fibre drum</xsl:when>
			<xsl:when test="$PackagingType='YX'">Composite packaging, glass receptacle in fibreboard box</xsl:when>
			<xsl:when test="$PackagingType='YY'">Composite packaging, glass receptacle in expandable plastic pack</xsl:when>
			<xsl:when test="$PackagingType='YZ'">Composite packaging, glass receptacle in solid plastic pack</xsl:when>
			<xsl:when test="$PackagingType='ZA'">Intermediate bulk container, paper, multi-wall</xsl:when>
			<xsl:when test="$PackagingType='ZB'">Bag, large</xsl:when>
			<xsl:when test="$PackagingType='ZC'">Intermediate bulk container, paper, multi-wall, water resistant</xsl:when>
			<xsl:when test="$PackagingType='ZD'">Intermediate bulk container, rigid plastic, with structural equipment, solids</xsl:when>
			<xsl:when test="$PackagingType='ZF'">Intermediate bulk container, rigid plastic, freestanding, solids</xsl:when>
			<xsl:when test="$PackagingType='ZG'">Intermediate bulk container, rigid plastic, with structural equipment, pressurised</xsl:when>
			<xsl:when test="$PackagingType='ZH'">Intermediate bulk container, rigid plastic, freestanding, pressurised</xsl:when>
			<xsl:when test="$PackagingType='ZJ'">Intermediate bulk container, rigid plastic, with structural equipment, liquids</xsl:when>
			<xsl:when test="$PackagingType='ZK'">Intermediate bulk container, rigid plastic, freestanding, liquids</xsl:when>
			<xsl:when test="$PackagingType='ZL'">Intermediate bulk container, composite, rigid plastic, solids</xsl:when>
			<xsl:when test="$PackagingType='ZM'">Intermediate bulk container, composite, flexible plastic, solids</xsl:when>
			<xsl:when test="$PackagingType='ZN'">Intermediate bulk container, composite, rigid plastic, pressurised</xsl:when>
			<xsl:when test="$PackagingType='ZP'">Intermediate bulk container, composite, flexible plastic, pressurised</xsl:when>
			<xsl:when test="$PackagingType='ZQ'">Intermediate bulk container, composite, rigid plastic, liquids</xsl:when>
			<xsl:when test="$PackagingType='ZR'">Intermediate bulk container, composite, flexible plastic, liquids</xsl:when>
			<xsl:when test="$PackagingType='ZS'">Intermediate bulk container, composite</xsl:when>
			<xsl:when test="$PackagingType='ZT'">Intermediate bulk container, fibreboard</xsl:when>
			<xsl:when test="$PackagingType='ZU'">Intermediate bulk container, flexible</xsl:when>
			<xsl:when test="$PackagingType='ZV'">Intermediate bulk container, metal, other than steel</xsl:when>
			<xsl:when test="$PackagingType='ZW'">Intermediate bulk container, natural wood</xsl:when>
			<xsl:when test="$PackagingType='ZX'">Intermediate bulk container, plywood</xsl:when>
			<xsl:when test="$PackagingType='ZY'">Intermediate bulk container, reconstituted wood</xsl:when>
			<xsl:otherwise><xsl:value-of select="$PackagingType"/></xsl:otherwise>
		</xsl:choose>		
	</xsl:template>
	<xsl:template name="Country">
		<xsl:param name="CountryType" />
		<xsl:choose>
			<xsl:when test="$CountryType='AF'">Afganistan</xsl:when>
			<xsl:when test="$CountryType='DE'">Almanya</xsl:when>
			<xsl:when test="$CountryType='AD'">Andorra</xsl:when>
			<xsl:when test="$CountryType='AO'">Angola</xsl:when>
			<xsl:when test="$CountryType='AG'">Antigua ve Barbuda</xsl:when>
			<xsl:when test="$CountryType='AR'">Arjantin</xsl:when>
			<xsl:when test="$CountryType='AL'">Arnavutluk</xsl:when>
			<xsl:when test="$CountryType='AW'">Aruba</xsl:when>
			<xsl:when test="$CountryType='AU'">Avustralya</xsl:when>
			<xsl:when test="$CountryType='AT'">Avusturya</xsl:when>
			<xsl:when test="$CountryType='AZ'">Azerbaycan</xsl:when>
			<xsl:when test="$CountryType='BS'">Bahamalar</xsl:when>
			<xsl:when test="$CountryType='BH'">Bahreyn</xsl:when>
			<xsl:when test="$CountryType='BD'">Bangladeş</xsl:when>
			<xsl:when test="$CountryType='BB'">Barbados</xsl:when>
			<xsl:when test="$CountryType='EH'">Batı Sahra (MA)</xsl:when>
			<xsl:when test="$CountryType='BE'">Belçika</xsl:when>
			<xsl:when test="$CountryType='BZ'">Belize</xsl:when>
			<xsl:when test="$CountryType='BJ'">Benin</xsl:when>
			<xsl:when test="$CountryType='BM'">Bermuda</xsl:when>
			<xsl:when test="$CountryType='BY'">Beyaz Rusya</xsl:when>
			<xsl:when test="$CountryType='BT'">Bhutan</xsl:when>
			<xsl:when test="$CountryType='AE'">Birleşik Arap Emirlikleri</xsl:when>
			<xsl:when test="$CountryType='US'">Birleşik Devletler</xsl:when>
			<xsl:when test="$CountryType='GB'">Birleşik Krallık</xsl:when>
			<xsl:when test="$CountryType='BO'">Bolivya</xsl:when>
			<xsl:when test="$CountryType='BA'">Bosna-Hersek</xsl:when>
			<xsl:when test="$CountryType='BW'">Botsvana</xsl:when>
			<xsl:when test="$CountryType='BR'">Brezilya</xsl:when>
			<xsl:when test="$CountryType='BN'">Bruney</xsl:when>
			<xsl:when test="$CountryType='BG'">Bulgaristan</xsl:when>
			<xsl:when test="$CountryType='BF'">Burkina Faso</xsl:when>
			<xsl:when test="$CountryType='BI'">Burundi</xsl:when>
			<xsl:when test="$CountryType='TD'">Çad</xsl:when>
			<xsl:when test="$CountryType='KY'">Cayman Adaları</xsl:when>
			<xsl:when test="$CountryType='GI'">Cebelitarık (GB)</xsl:when>
			<xsl:when test="$CountryType='CZ'">Çek Cumhuriyeti</xsl:when>
			<xsl:when test="$CountryType='DZ'">Cezayir</xsl:when>
			<xsl:when test="$CountryType='DJ'">Cibuti</xsl:when>
			<xsl:when test="$CountryType='CN'">Çin</xsl:when>
			<xsl:when test="$CountryType='DK'">Danimarka</xsl:when>
			<xsl:when test="$CountryType='CD'">Demokratik Kongo Cumhuriyeti</xsl:when>
			<xsl:when test="$CountryType='TL'">Doğu Timor</xsl:when>
			<xsl:when test="$CountryType='DO'">Dominik Cumhuriyeti</xsl:when>
			<xsl:when test="$CountryType='DM'">Dominika</xsl:when>
			<xsl:when test="$CountryType='EC'">Ekvador</xsl:when>
			<xsl:when test="$CountryType='GQ'">Ekvator Ginesi</xsl:when>
			<xsl:when test="$CountryType='SV'">El Salvador</xsl:when>
			<xsl:when test="$CountryType='ID'">Endonezya</xsl:when>
			<xsl:when test="$CountryType='ER'">Eritre</xsl:when>
			<xsl:when test="$CountryType='AM'">Ermenistan</xsl:when>
			<xsl:when test="$CountryType='MF'">Ermiş Martin (FR)</xsl:when>
			<xsl:when test="$CountryType='EE'">Estonya</xsl:when>
			<xsl:when test="$CountryType='ET'">Etiyopya</xsl:when>
			<xsl:when test="$CountryType='FK'">Falkland Adaları</xsl:when>
			<xsl:when test="$CountryType='FO'">Faroe Adaları (DK)</xsl:when>
			<xsl:when test="$CountryType='MA'">Fas</xsl:when>
			<xsl:when test="$CountryType='FJ'">Fiji</xsl:when>
			<xsl:when test="$CountryType='CI'">Fildişi Sahili</xsl:when>
			<xsl:when test="$CountryType='PH'">Filipinler</xsl:when>
			<xsl:when test="$CountryType='FI'">Finlandiya</xsl:when>
			<xsl:when test="$CountryType='FR'">Fransa</xsl:when>
			<xsl:when test="$CountryType='GF'">Fransız Guyanası (FR)</xsl:when>
			<xsl:when test="$CountryType='PF'">Fransız Polinezyası (FR)</xsl:when>
			<xsl:when test="$CountryType='GA'">Gabon</xsl:when>
			<xsl:when test="$CountryType='GM'">Gambiya</xsl:when>
			<xsl:when test="$CountryType='GH'">Gana</xsl:when>
			<xsl:when test="$CountryType='GN'">Gine</xsl:when>
			<xsl:when test="$CountryType='GW'">Gine Bissau</xsl:when>
			<xsl:when test="$CountryType='GD'">Grenada</xsl:when>
			<xsl:when test="$CountryType='GL'">Grönland (DK)</xsl:when>
			<xsl:when test="$CountryType='GP'">Guadeloupe (FR)</xsl:when>
			<xsl:when test="$CountryType='GT'">Guatemala</xsl:when>
			<xsl:when test="$CountryType='GG'">Guernsey (GB)</xsl:when>
			<xsl:when test="$CountryType='ZA'">Güney Afrika</xsl:when>
			<xsl:when test="$CountryType='KR'">Güney Kore</xsl:when>
			<xsl:when test="$CountryType='GE'">Gürcistan</xsl:when>
			<xsl:when test="$CountryType='GY'">Guyana</xsl:when>
			<xsl:when test="$CountryType='HT'">Haiti</xsl:when>
			<xsl:when test="$CountryType='IN'">Hindistan</xsl:when>
			<xsl:when test="$CountryType='HR'">Hırvatistan</xsl:when>
			<xsl:when test="$CountryType='NL'">Hollanda</xsl:when>
			<xsl:when test="$CountryType='HN'">Honduras</xsl:when>
			<xsl:when test="$CountryType='HK'">Hong Kong (CN)</xsl:when>
			<xsl:when test="$CountryType='VG'">İngiliz Virjin Adaları</xsl:when>
			<xsl:when test="$CountryType='IQ'">Irak</xsl:when>
			<xsl:when test="$CountryType='IR'">İran</xsl:when>
			<xsl:when test="$CountryType='IE'">İrlanda</xsl:when>
			<xsl:when test="$CountryType='ES'">İspanya</xsl:when>
			<xsl:when test="$CountryType='IL'">İsrail</xsl:when>
			<xsl:when test="$CountryType='SE'">İsveç</xsl:when>
			<xsl:when test="$CountryType='CH'">İsviçre</xsl:when>
			<xsl:when test="$CountryType='IT'">İtalya</xsl:when>
			<xsl:when test="$CountryType='IS'">İzlanda</xsl:when>
			<xsl:when test="$CountryType='JM'">Jamaika</xsl:when>
			<xsl:when test="$CountryType='JP'">Japonya</xsl:when>
			<xsl:when test="$CountryType='JE'">Jersey (GB)</xsl:when>
			<xsl:when test="$CountryType='KH'">Kamboçya</xsl:when>
			<xsl:when test="$CountryType='CM'">Kamerun</xsl:when>
			<xsl:when test="$CountryType='CA'">Kanada</xsl:when>
			<xsl:when test="$CountryType='ME'">Karadağ</xsl:when>
			<xsl:when test="$CountryType='QA'">Katar</xsl:when>
			<xsl:when test="$CountryType='KZ'">Kazakistan</xsl:when>
			<xsl:when test="$CountryType='KE'">Kenya</xsl:when>
			<xsl:when test="$CountryType='CY'">Kıbrıs</xsl:when>
			<xsl:when test="$CountryType='KG'">Kırgızistan</xsl:when>
			<xsl:when test="$CountryType='KI'">Kiribati</xsl:when>
			<xsl:when test="$CountryType='CO'">Kolombiya</xsl:when>
			<xsl:when test="$CountryType='KM'">Komorlar</xsl:when>
			<xsl:when test="$CountryType='CG'">Kongo Cumhuriyeti</xsl:when>
			<xsl:when test="$CountryType='KV'">Kosova (RS)</xsl:when>
			<xsl:when test="$CountryType='CR'">Kosta Rika</xsl:when>
			<xsl:when test="$CountryType='CU'">Küba</xsl:when>
			<xsl:when test="$CountryType='KW'">Kuveyt</xsl:when>
			<xsl:when test="$CountryType='KP'">Kuzey Kore</xsl:when>
			<xsl:when test="$CountryType='LA'">Laos</xsl:when>
			<xsl:when test="$CountryType='LS'">Lesoto</xsl:when>
			<xsl:when test="$CountryType='LV'">Letonya</xsl:when>
			<xsl:when test="$CountryType='LR'">Liberya</xsl:when>
			<xsl:when test="$CountryType='LY'">Libya</xsl:when>
			<xsl:when test="$CountryType='LI'">Lihtenştayn</xsl:when>
			<xsl:when test="$CountryType='LT'">Litvanya</xsl:when>
			<xsl:when test="$CountryType='LB'">Lübnan</xsl:when>
			<xsl:when test="$CountryType='LU'">Lüksemburg</xsl:when>
			<xsl:when test="$CountryType='HU'">Macaristan</xsl:when>
			<xsl:when test="$CountryType='MG'">Madagaskar</xsl:when>
			<xsl:when test="$CountryType='MO'">Makao (CN)</xsl:when>
			<xsl:when test="$CountryType='MK'">Makedonya</xsl:when>
			<xsl:when test="$CountryType='MW'">Malavi</xsl:when>
			<xsl:when test="$CountryType='MV'">Maldivler</xsl:when>
			<xsl:when test="$CountryType='MY'">Malezya</xsl:when>
			<xsl:when test="$CountryType='ML'">Mali</xsl:when>
			<xsl:when test="$CountryType='MT'">Malta</xsl:when>
			<xsl:when test="$CountryType='IM'">Man Adası (GB)</xsl:when>
			<xsl:when test="$CountryType='MH'">Marshall Adaları</xsl:when>
			<xsl:when test="$CountryType='MQ'">Martinique (FR)</xsl:when>
			<xsl:when test="$CountryType='MU'">Mauritius</xsl:when>
			<xsl:when test="$CountryType='YT'">Mayotte (FR)</xsl:when>
			<xsl:when test="$CountryType='MX'">Meksika</xsl:when>
			<xsl:when test="$CountryType='FM'">Mikronezya</xsl:when>
			<xsl:when test="$CountryType='EG'">Mısır</xsl:when>
			<xsl:when test="$CountryType='MN'">Moğolistan</xsl:when>
			<xsl:when test="$CountryType='MD'">Moldova</xsl:when>
			<xsl:when test="$CountryType='MC'">Monako</xsl:when>
			<xsl:when test="$CountryType='MR'">Moritanya</xsl:when>
			<xsl:when test="$CountryType='MZ'">Mozambik</xsl:when>
			<xsl:when test="$CountryType='MM'">Myanmar</xsl:when>
			<xsl:when test="$CountryType='NA'">Namibya</xsl:when>
			<xsl:when test="$CountryType='NR'">Nauru</xsl:when>
			<xsl:when test="$CountryType='NP'">Nepal</xsl:when>
			<xsl:when test="$CountryType='NE'">Nijer</xsl:when>
			<xsl:when test="$CountryType='NG'">Nijerya</xsl:when>
			<xsl:when test="$CountryType='NI'">Nikaragua</xsl:when>
			<xsl:when test="$CountryType='NO'">Norveç</xsl:when>
			<xsl:when test="$CountryType='CF'">Orta Afrika Cumhuriyeti</xsl:when>
			<xsl:when test="$CountryType='UZ'">Özbekistan</xsl:when>
			<xsl:when test="$CountryType='PK'">Pakistan</xsl:when>
			<xsl:when test="$CountryType='PW'">Palau</xsl:when>
			<xsl:when test="$CountryType='PA'">Panama</xsl:when>
			<xsl:when test="$CountryType='PG'">Papua Yeni Gine</xsl:when>
			<xsl:when test="$CountryType='PY'">Paraguay</xsl:when>
			<xsl:when test="$CountryType='PE'">Peru</xsl:when>
			<xsl:when test="$CountryType='PL'">Polonya</xsl:when>
			<xsl:when test="$CountryType='PT'">Portekiz</xsl:when>
			<xsl:when test="$CountryType='PR'">Porto Riko (US)</xsl:when>
			<xsl:when test="$CountryType='RE'">Réunion (FR)</xsl:when>
			<xsl:when test="$CountryType='RO'">Romanya</xsl:when>
			<xsl:when test="$CountryType='RW'">Ruanda</xsl:when>
			<xsl:when test="$CountryType='RU'">Rusya</xsl:when>
			<xsl:when test="$CountryType='BL'">Saint Barthélemy (FR)</xsl:when>
			<xsl:when test="$CountryType='KN'">Saint Kitts ve Nevis</xsl:when>
			<xsl:when test="$CountryType='LC'">Saint Lucia</xsl:when>
			<xsl:when test="$CountryType='PM'">Saint Pierre ve Miquelon (FR)</xsl:when>
			<xsl:when test="$CountryType='VC'">Saint Vincent ve Grenadinler</xsl:when>
			<xsl:when test="$CountryType='WS'">Samoa</xsl:when>
			<xsl:when test="$CountryType='SM'">San Marino</xsl:when>
			<xsl:when test="$CountryType='ST'">São Tomé ve Príncipe</xsl:when>
			<xsl:when test="$CountryType='SN'">Senegal</xsl:when>
			<xsl:when test="$CountryType='SC'">Seyşeller</xsl:when>
			<xsl:when test="$CountryType='SL'">Sierra Leone</xsl:when>
			<xsl:when test="$CountryType='CL'">Şili</xsl:when>
			<xsl:when test="$CountryType='SG'">Singapur</xsl:when>
			<xsl:when test="$CountryType='RS'">Sırbistan</xsl:when>
			<xsl:when test="$CountryType='SK'">Slovakya Cumhuriyeti</xsl:when>
			<xsl:when test="$CountryType='SI'">Slovenya</xsl:when>
			<xsl:when test="$CountryType='SB'">Solomon Adaları</xsl:when>
			<xsl:when test="$CountryType='SO'">Somali</xsl:when>
			<xsl:when test="$CountryType='SS'">South Sudan</xsl:when>
			<xsl:when test="$CountryType='SJ'">Spitsbergen (NO)</xsl:when>
			<xsl:when test="$CountryType='LK'">Sri Lanka</xsl:when>
			<xsl:when test="$CountryType='SD'">Sudan</xsl:when>
			<xsl:when test="$CountryType='SR'">Surinam</xsl:when>
			<xsl:when test="$CountryType='SY'">Suriye</xsl:when>
			<xsl:when test="$CountryType='SA'">Suudi Arabistan</xsl:when>
			<xsl:when test="$CountryType='SZ'">Svaziland</xsl:when>
			<xsl:when test="$CountryType='TJ'">Tacikistan</xsl:when>
			<xsl:when test="$CountryType='TZ'">Tanzanya</xsl:when>
			<xsl:when test="$CountryType='TH'">Tayland</xsl:when>
			<xsl:when test="$CountryType='TW'">Tayvan</xsl:when>
			<xsl:when test="$CountryType='TG'">Togo</xsl:when>
			<xsl:when test="$CountryType='TO'">Tonga</xsl:when>
			<xsl:when test="$CountryType='TT'">Trinidad ve Tobago</xsl:when>
			<xsl:when test="$CountryType='TN'">Tunus</xsl:when>
			<xsl:when test="$CountryType='TR'">Türkiye</xsl:when>
			<xsl:when test="$CountryType='TM'">Türkmenistan</xsl:when>
			<xsl:when test="$CountryType='TC'">Turks ve Caicos</xsl:when>
			<xsl:when test="$CountryType='TV'">Tuvalu</xsl:when>
			<xsl:when test="$CountryType='UG'">Uganda</xsl:when>
			<xsl:when test="$CountryType='UA'">Ukrayna</xsl:when>
			<xsl:when test="$CountryType='OM'">Umman</xsl:when>
			<xsl:when test="$CountryType='JO'">Ürdün</xsl:when>
			<xsl:when test="$CountryType='UY'">Uruguay</xsl:when>
			<xsl:when test="$CountryType='VU'">Vanuatu</xsl:when>
			<xsl:when test="$CountryType='VA'">Vatikan</xsl:when>
			<xsl:when test="$CountryType='VE'">Venezuela</xsl:when>
			<xsl:when test="$CountryType='VN'">Vietnam</xsl:when>
			<xsl:when test="$CountryType='WF'">Wallis ve Futuna (FR)</xsl:when>
			<xsl:when test="$CountryType='YE'">Yemen</xsl:when>
			<xsl:when test="$CountryType='NC'">Yeni Kaledonya (FR)</xsl:when>
			<xsl:when test="$CountryType='NZ'">Yeni Zelanda</xsl:when>
			<xsl:when test="$CountryType='CV'">Yeşil Burun Adaları</xsl:when>
			<xsl:when test="$CountryType='GR'">Yunanistan</xsl:when>
			<xsl:when test="$CountryType='ZM'">Zambiya</xsl:when>
			<xsl:when test="$CountryType='ZW'">Zimbabve</xsl:when>
			<xsl:otherwise><xsl:value-of select="$CountryType"/></xsl:otherwise>
		</xsl:choose>
		
	</xsl:template>
	<xsl:template name='Party_Other'>
		<xsl:param name="PartyType" />
		<xsl:for-each select="cbc:WebsiteURI">
			<tr align="left">
				<td>
					<xsl:text>Web Sitesi: </xsl:text>
					<xsl:value-of select="."/>
				</td>
			</tr>
		</xsl:for-each>
		<xsl:for-each select="cac:Contact/cbc:ElectronicMail">
			<tr align="left">
				<td>
					<xsl:text>E-Posta: </xsl:text>
					<xsl:value-of select="."/>
				</td>
			</tr>
		</xsl:for-each>	
		<xsl:for-each select="cac:Contact">
			<xsl:if test="cbc:Telephone or cbc:Telefax">
				<tr align="left">
					<td style="width:469px; " align="left">
						<xsl:for-each select="cbc:Telephone">
							<xsl:text>Tel: </xsl:text>
							<xsl:apply-templates/>
						</xsl:for-each>
						<xsl:for-each select="cbc:Telefax">
							<xsl:text> Fax: </xsl:text>
							<xsl:apply-templates/>
						</xsl:for-each>
						<xsl:text>&#160;</xsl:text>
					</td>
				</tr>
			</xsl:if>
		</xsl:for-each>
		<xsl:if test="$PartyType!='TAXFREE' and $PartyType!='EXPORT'">
			<xsl:for-each select="cac:PartyTaxScheme/cac:TaxScheme/cbc:Name">
				<tr align="left">
					<td>
						<xsl:text>Vergi Dairesi: </xsl:text>
						<xsl:apply-templates/>
					</td>
				</tr>
			</xsl:for-each>
			<xsl:for-each select="cac:PartyIdentification">
			<tr align="left">
				<td>
					<xsl:value-of select="cbc:ID/@schemeID"/>
					<xsl:text>: </xsl:text>
					<xsl:value-of select="cbc:ID"/>
				</td>
			</tr>
			</xsl:for-each>
		</xsl:if>
	</xsl:template>
	<xsl:template name="Curr_Type">
		<xsl:value-of select="format-number(., '###.##0,00', 'european')"/>		
		<xsl:if	test="@currencyID">
			<xsl:text> </xsl:text>
			<xsl:choose>
				<xsl:when test="@currencyID = 'TRL' or @currencyID = 'TRY'">
					<xsl:text>TL</xsl:text>					
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="@currencyID"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:if>		
	</xsl:template>
</xsl:stylesheet>
