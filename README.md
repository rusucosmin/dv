# Data Visualization course


## Data document

This document serves as a brief documentation for catchmentExperiments
catchmentExperiments is an SQLite database file created using the program Base for the Mac;
it should be possible to access the data using any standard SQLite program or interface. As an
SQLite file it does not require a separate database process to access.
This database contains information from a number of studies of the effects of different types of
land-cover change on streamflow.
catchmentExperiments is made up of 4 primary tables: catchmentSites,
experimentalCatchments, controlCatchments, and referencePapers. In this particular work, we
consider each site to be made up of multiple catchments, each of which may serve as a unique
study. catchmentSites provides basic information about the sites where experiments have taken
place, while experimentalCatchment provides detailed information about the specific catchment
in which a study was done and the results of the study. controlCatchments are the catchments
which serve as controls for those in the experimental catchments, while referencePapers
provide information about the source of the results.
The results of 4 different hydrologic outcomes of interest are included: annual water yield (the
total flow out of a watershed in a year), as well as measures of low-flow, peak flow, and
groundwater recharge that can vary between sites—these should be comparable across sites
on a relative basis despite the difference in the actual measures.
Both controlCatchments and experimentalCatchments have foreign keys to catchmentSites to
link the catchments to the sites. experimentalCatchments also has a foreign key to
controlCatchments. Finally, both catchmentSites and experimentalCatchments have lists of
citations that have foreign keys to referencePapers so that each catchment is linked with the
source of the information for reliability.
Further detail on the fields in each table will be provided later in the text below.
Data visualization:
The goal of this project is to provide an intuitive and interactive data visualization tool to
examine the literature evidence for changes in hydrologic processes from nature-based
solutions or other land-cover change operations. The primary goal is to summarize the data in
easy-to-comprehend graphics for the big story, but also to allow users to dig in and get more
details on what the actual results of the experiments were, as well as where they were and the
conditions under which they occurred.
A couple of notes: Feel free to extrapolate the results of catchment experiments to a consistent
change fraction—while the processes are not linear, they are often close enough that this is a
reasonable approach, and allows for comparison across sites.
experimentalCatchments includes a set of flags (1=true, 0=false) for whether the changes were
found to be statistically significant. Those results with changes that are statistically significant
are more certain than those which are not—but those which are not can provide some
supporting evidence for the direction and size of change seen.
We are looking to summarize the results for each activity (deforestation, afforestation, wetland
added, wetland removed, etc.) as well as for each hydrologic outcome. For each of these, the
strength and certainty of the results, and also the number of studies serve as important
measures of how well we understand hydrologic behavior under these conditions.
10/23/18: The database has a sample of 18 catchment results from 6 catchment sites. More will
be added in the next week. At this time all the studies are of forest removal, though in the future
some will include either the addition of forests or changes in wetlands and the management of
rangelands and agricultural areas.
